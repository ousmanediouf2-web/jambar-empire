const express = require("express");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const {
  CATEGORIES,
  TECHNOLOGIES,
  trouverTechnologie,
  calculerCout,
  calculerDureeSecondes,
  bonusRecherches
} = require("../config/recherches");

const router = express.Router();

// Termine les recherches dont le minuteur est ecoule (cote serveur uniquement)
async function finaliserRecherches(joueur) {
  const maintenant = new Date();
  let modifie = false;
  for (const r of joueur.recherches) {
    if (r.finRecherche && r.finRecherche <= maintenant) {
      r.niveau += 1;
      r.finRecherche = null;
      modifie = true;
    }
  }
  if (modifie) await joueur.save();
  return joueur;
}

function niveauRecherche(joueur, code) {
  return joueur.recherches?.find((r) => r.code === code)?.niveau || 0;
}

function prerequisRemplis(joueur, tech) {
  if (!tech.prerequis) return { ok: true };
  for (const [code, niveauRequis] of Object.entries(tech.prerequis)) {
    if (niveauRecherche(joueur, code) < niveauRequis) {
      const requise = trouverTechnologie(code);
      return { ok: false, message: `Necessite ${requise?.nom || code} niveau ${niveauRequis}` };
    }
  }
  return { ok: true };
}

// Arbre complet avec l'etat du joueur
router.get("/", async (req, res) => {
  try {
    const joueur = await Joueur.findById(req.user._id);
    await finaliserRecherches(joueur);

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (ville) await rafraichirVille(ville);

    const niveauAcademie = ville?.batiments?.find((b) => b.type === "academie")?.niveau ?? 0;

    const technologies = TECHNOLOGIES.map((tech) => {
      const niveau = niveauRecherche(joueur, tech.code);
      const enCours = joueur.recherches?.find((r) => r.code === tech.code)?.finRecherche || null;
      const prerequis = prerequisRemplis(joueur, tech);

      return {
        code: tech.code,
        nom: tech.nom,
        categorie: tech.categorie,
        description: tech.description,
        niveau,
        niveauMax: tech.niveauMax,
        effet: tech.effet,
        bonusActuel: tech.effet.parNiveau * niveau,
        academieRequise: tech.academieRequise,
        academieOk: niveauAcademie >= tech.academieRequise,
        prerequis: tech.prerequis || null,
        prerequisOk: prerequis.ok,
        messagePrerequis: prerequis.message || null,
        cout: niveau < tech.niveauMax ? calculerCout(tech.code, niveau) : null,
        dureeSecondes: niveau < tech.niveauMax ? calculerDureeSecondes(tech.code, niveau) : null,
        finRecherche: enCours
      };
    });

    res.json({
      categories: CATEGORIES,
      technologies,
      niveauAcademie,
      ressources: ville?.ressources || {},
      bonus: bonusRecherches(joueur.recherches)
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Lancer une recherche
router.post("/:code/lancer", async (req, res) => {
  try {
    const tech = trouverTechnologie(req.params.code);
    if (!tech) return res.status(400).json({ erreur: "Technologie inconnue" });

    const joueur = await Joueur.findById(req.user._id);
    await finaliserRecherches(joueur);

    // Une seule recherche a la fois dans tout l'empire
    const dejaEnCours = joueur.recherches?.find((r) => r.finRecherche);
    if (dejaEnCours) {
      const nom = trouverTechnologie(dejaEnCours.code)?.nom || dejaEnCours.code;
      return res.status(400).json({ erreur: `Une recherche est deja en cours : ${nom}` });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    const niveauAcademie = ville.batiments?.find((b) => b.type === "academie")?.niveau ?? 0;
    if (niveauAcademie < tech.academieRequise) {
      return res.status(400).json({
        erreur: `Ton Academie doit etre au niveau ${tech.academieRequise} pour cette recherche`
      });
    }

    const prerequis = prerequisRemplis(joueur, tech);
    if (!prerequis.ok) return res.status(400).json({ erreur: prerequis.message });

    const niveauActuel = niveauRecherche(joueur, tech.code);
    if (niveauActuel >= tech.niveauMax) {
      return res.status(400).json({ erreur: "Cette technologie est deja au niveau maximum" });
    }

    const cout = calculerCout(tech.code, niveauActuel);
    for (const [ressource, quantite] of Object.entries(cout)) {
      if ((ville.ressources[ressource] ?? 0) < quantite) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: cout });
      }
    }

    for (const [ressource, quantite] of Object.entries(cout)) {
      ville.ressources[ressource] -= quantite;
      await MouvementRessource.create({
        joueur: joueur._id,
        type: ressource,
        quantite: -quantite,
        origine: "construction",
        soldeApres: ville.ressources[ressource]
      });
    }
    await ville.save();

    const duree = calculerDureeSecondes(tech.code, niveauActuel);
    const fin = new Date(Date.now() + duree * 1000);

    const existante = joueur.recherches?.find((r) => r.code === tech.code);
    if (existante) {
      existante.finRecherche = fin;
    } else {
      joueur.recherches.push({ code: tech.code, niveau: 0, finRecherche: fin });
    }
    await joueur.save();

    res.json({
      message: `Recherche lancee : ${tech.nom} niveau ${niveauActuel + 1}`,
      finRecherche: fin,
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.finaliserRecherches = finaliserRecherches;
module.exports = router;
