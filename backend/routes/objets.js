const express = require("express");
const ObjetInventaire = require("../models/ObjetInventaire");
const Ville = require("../models/Ville");
const Joueur = require("../models/Joueur");
const Tile = require("../models/Tile");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const { CATEGORIES, trouverObjet, catalogue, boutique } = require("../config/objets");
const { trouverEmplacementAleatoire } = require("../services/placementService");

const router = express.Router();

// Mon inventaire d'objets
router.get("/", async (req, res) => {
  const possedes = await ObjetInventaire.find({ joueur: req.user._id, quantite: { $gt: 0 } }).lean();
  const enrichis = possedes.map((o) => {
    const fiche = trouverObjet(o.code);
    return { ...o, ...(fiche || {}), nom: fiche?.nom || o.code };
  });

  const ville = await Ville.findOne({ proprietaire: req.user._id });
  res.json({
    categories: CATEGORIES,
    objets: enrichis,
    protectionJusquA: ville?.protectionJusquA || null,
    catalogue: catalogue(),
    boutique: boutique(),
    or: ville?.ressources?.or ?? 0
  });
});

// Acheter un objet contre des gemmes
router.post("/:code/acheter", async (req, res) => {
  try {
    const fiche = trouverObjet(req.params.code);
    if (!fiche || !fiche.prixOr) return res.status(400).json({ erreur: "Objet non disponible a la vente" });

    const quantite = Math.max(1, Math.min(99, Number(req.body?.quantite) || 1));
    const cout = fiche.prixOr * quantite;

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    if ((ville.ressources.or ?? 0) < cout) {
      return res.status(400).json({ erreur: `Il te faut ${cout} gemmes (tu en as ${ville.ressources.or ?? 0})` });
    }

    ville.ressources.or -= cout;
    await ville.save();

    await MouvementRessource.create({
      joueur: req.user._id, type: "or", quantite: -cout,
      origine: "achat", soldeApres: ville.ressources.or
    });

    await ObjetInventaire.findOneAndUpdate(
      { joueur: req.user._id, code: fiche.code },
      { $inc: { quantite } },
      { upsert: true, new: true }
    );

    res.json({
      message: `${quantite}x ${fiche.nom} achete pour ${cout} gemmes`,
      or: ville.ressources.or
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Utiliser un objet
router.post("/:code/utiliser", async (req, res) => {
  try {
    const fiche = trouverObjet(req.params.code);
    if (!fiche) return res.status(400).json({ erreur: "Objet inconnu" });

    const possede = await ObjetInventaire.findOne({ joueur: req.user._id, code: fiche.code });
    if (!possede || possede.quantite < 1) {
      return res.status(400).json({ erreur: "Tu ne possedes pas cet objet" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    let message = "";

    // --- ACCELERATIONS ---
    if (fiche.categorie === "acceleration" || fiche.rechercheSecondes) {
      const secondes = fiche.secondes || fiche.rechercheSecondes;
      const cible = fiche.rechercheSecondes ? "recherche" : fiche.cible;
      let applique = false;

      if (cible === "toutes" || cible === "construction") {
        const chantier = ville.batiments.find((b) => b.finAmelioration);
        if (chantier) {
          chantier.finAmelioration = new Date(
            Math.max(Date.now(), new Date(chantier.finAmelioration).getTime() - secondes * 1000)
          );
          await ville.save();
          message = `Travaux acceleres de ${Math.round(secondes / 60)} min`;
          applique = true;
        }
      }

      if (!applique && (cible === "toutes" || cible === "entrainement")) {
        const lot = ville.fileEntrainement?.[0];
        if (lot) {
          lot.finEntrainement = new Date(
            Math.max(Date.now(), new Date(lot.finEntrainement).getTime() - secondes * 1000)
          );
          await ville.save();
          message = `Formation acceleree de ${Math.round(secondes / 60)} min`;
          applique = true;
        }
      }

      if (!applique && (cible === "toutes" || cible === "recherche")) {
        const joueur = await Joueur.findById(req.user._id);
        const rech = joueur.recherches?.find((r) => r.finRecherche);
        if (rech) {
          rech.finRecherche = new Date(
            Math.max(Date.now(), new Date(rech.finRecherche).getTime() - secondes * 1000)
          );
          await joueur.save();
          message = `Recherche acceleree de ${Math.round(secondes / 60)} min`;
          applique = true;
        }
      }

      if (!applique) {
        return res.status(400).json({ erreur: "Aucun travail en cours sur lequel appliquer cette acceleration" });
      }
    }

    // --- PROTECTION ---
    else if (fiche.categorie === "protection") {
      const depart = ville.protectionJusquA && ville.protectionJusquA > new Date()
        ? new Date(ville.protectionJusquA).getTime()
        : Date.now();
      ville.protectionJusquA = new Date(depart + fiche.heures * 3600 * 1000);
      await ville.save();
      message = `Bouclier actif jusqu'au ${ville.protectionJusquA.toLocaleString("fr-FR")}`;
    }

    // --- COFFRES DE RESSOURCES ---
    else if (fiche.categorie === "ressource") {
      const gains = [];
      for (const [ressource, quantite] of Object.entries(fiche.gain)) {
        if (ville.ressources[ressource] === undefined) continue;
        ville.ressources[ressource] += quantite;
        gains.push(`${quantite} ${ressource}`);
        await MouvementRessource.create({
          joueur: req.user._id, type: ressource, quantite,
          origine: "quete", soldeApres: ville.ressources[ressource]
        });
      }
      await ville.save();
      message = `Coffre ouvert : +${gains.join(", ")}`;
    }

    // --- TELEPORTEURS ---
    else if (fiche.categorie === "deplacement") {
      const ancienne = await Tile.findOne({ ville: ville._id });
      const nouvelle = await trouverEmplacementAleatoire();
      if (!nouvelle) return res.status(400).json({ erreur: "Aucun emplacement libre sur la carte" });

      if (ancienne) {
        ancienne.proprietaire = null;
        ancienne.ville = null;
        await ancienne.save();
      }
      nouvelle.proprietaire = req.user._id;
      nouvelle.ville = ville._id;
      await nouvelle.save();

      ville.coordonnees = { x: nouvelle.x, y: nouvelle.y };
      ville.countryCity = nouvelle.countryCity;
      await ville.save();
      message = `Cite deplacee en (${nouvelle.x}, ${nouvelle.y})`;
    }

    else {
      return res.status(400).json({ erreur: "Cet objet ne peut pas encore etre utilise" });
    }

    possede.quantite -= 1;
    await possede.save();

    res.json({ message, ressources: ville.ressources, protectionJusquA: ville.protectionJusquA });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
