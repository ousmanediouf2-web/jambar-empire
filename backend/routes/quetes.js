const express = require("express");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const HerosJoueur = require("../models/HerosJoueur");
const QueteJoueur = require("../models/QueteJoueur");
const RapportBataille = require("../models/RapportBataille");
const Marche = require("../models/Marche");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const { CATEGORIES, QUETES, trouverQuete } = require("../config/quetes");

const router = express.Router();

const DELAI_QUOTIDIEN = 24 * 60 * 60 * 1000;
const DELAI_HEBDOMADAIRE = 7 * 24 * 60 * 60 * 1000;

// Rassemble l'etat reel du joueur pour evaluer la progression des quetes
async function etatJoueur(joueurId) {
  const [joueur, ville, nbHeros, victoires, collectes] = await Promise.all([
    Joueur.findById(joueurId).lean(),
    Ville.findOne({ proprietaire: joueurId }),
    HerosJoueur.countDocuments({ joueur: joueurId }),
    RapportBataille.countDocuments({ joueur: joueurId, victoire: true }),
    Marche.countDocuments({ joueur: joueurId, etat: "terminee" })
  ]);

  if (ville) await rafraichirVille(ville);

  const troupesTotal = ville
    ? Object.entries(ville.armee.toObject ? ville.armee.toObject() : ville.armee)
        .filter(([cle]) => cle !== "_id")
        .reduce((t, [, q]) => t + (q || 0), 0)
    : 0;

  const rechercheTotale = (joueur?.recherches || []).reduce((t, r) => t + (r.niveau || 0), 0);

  return {
    joueur,
    ville,
    nbHeros,
    victoires,
    collectes,
    troupesTotal,
    rechercheTotale,
    prestige: joueur?.pointsPrestige || 0,
    aAlliance: Boolean(joueur?.alliance)
  };
}

function progression(quete, etat) {
  const c = quete.condition;
  switch (c.type) {
    case "batiment_niveau": {
      const niveau = etat.ville?.batiments?.find((b) => b.type === c.batiment)?.niveau ?? 0;
      return { actuel: niveau, cible: c.cible };
    }
    case "troupes_total": return { actuel: etat.troupesTotal, cible: c.cible };
    case "heros_total": return { actuel: etat.nbHeros, cible: c.cible };
    case "victoires": return { actuel: etat.victoires, cible: c.cible };
    case "recherche_totale": return { actuel: etat.rechercheTotale, cible: c.cible };
    case "prestige": return { actuel: etat.prestige, cible: c.cible };
    case "marches": return { actuel: etat.collectes, cible: c.cible };
    case "alliance": return { actuel: etat.aAlliance ? 1 : 0, cible: 1 };
    default: return { actuel: 0, cible: c.cible || 1 };
  }
}

function delaiCategorie(categorie) {
  if (categorie === "quotidienne") return DELAI_QUOTIDIEN;
  if (categorie === "hebdomadaire") return DELAI_HEBDOMADAIRE;
  return null;
}

function reclamable(quete, suivi) {
  if (!suivi) return true;
  const delai = delaiCategorie(quete.categorie);
  if (!delai) return suivi.nbReclamations === 0;
  if (!suivi.derniereReclamation) return true;
  return Date.now() - new Date(suivi.derniereReclamation).getTime() >= delai;
}

// Liste des quetes avec progression
router.get("/", async (req, res) => {
  try {
    const etat = await etatJoueur(req.user._id);
    const suivis = await QueteJoueur.find({ joueur: req.user._id }).lean();
    const parCode = {};
    for (const s of suivis) parCode[s.code] = s;

    const quetes = QUETES.map((q) => {
      const p = progression(q, etat);
      const suivi = parCode[q.code];
      const terminee = p.actuel >= p.cible;
      const peutReclamer = terminee && reclamable(q, suivi);
      const delai = delaiCategorie(q.categorie);

      let prochaineDispo = null;
      if (delai && suivi?.derniereReclamation) {
        const dispo = new Date(suivi.derniereReclamation).getTime() + delai;
        if (dispo > Date.now()) prochaineDispo = new Date(dispo);
      }

      return {
        code: q.code,
        categorie: q.categorie,
        titre: q.titre,
        description: q.description,
        recompense: q.recompense,
        progression: p,
        terminee,
        peutReclamer,
        dejaReclamee: Boolean(suivi?.nbReclamations) && !peutReclamer,
        prochaineDispo
      };
    });

    res.json({ categories: CATEGORIES, quetes });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Reclamer la recompense d'une quete terminee
router.post("/:code/reclamer", async (req, res) => {
  try {
    const quete = trouverQuete(req.params.code);
    if (!quete) return res.status(404).json({ erreur: "Quete inconnue" });

    const etat = await etatJoueur(req.user._id);
    const p = progression(quete, etat);
    if (p.actuel < p.cible) {
      return res.status(400).json({ erreur: "Cette quete n'est pas encore terminee" });
    }

    const suivi = await QueteJoueur.findOne({ joueur: req.user._id, code: quete.code });
    if (!reclamable(quete, suivi)) {
      return res.status(400).json({ erreur: "Recompense deja reclamee" });
    }

    const ville = etat.ville;
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

    const gains = {};
    for (const [cle, quantite] of Object.entries(quete.recompense)) {
      if (cle === "prestige") {
        await Joueur.findByIdAndUpdate(req.user._id, { $inc: { pointsPrestige: quantite } });
        gains.prestige = quantite;
        continue;
      }
      if (ville.ressources[cle] === undefined) continue;
      ville.ressources[cle] += quantite;
      gains[cle] = quantite;

      await MouvementRessource.create({
        joueur: req.user._id,
        type: cle,
        quantite,
        origine: "quete",
        soldeApres: ville.ressources[cle]
      });
    }
    await ville.save();

    if (suivi) {
      suivi.nbReclamations += 1;
      suivi.derniereReclamation = new Date();
      await suivi.save();
    } else {
      await QueteJoueur.create({
        joueur: req.user._id,
        code: quete.code,
        nbReclamations: 1,
        derniereReclamation: new Date()
      });
    }

    res.json({ message: `Recompense reclamee : ${quete.titre}`, gains, ressources: ville.ressources });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
