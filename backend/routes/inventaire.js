const express = require("express");
const ObjetJoueur = require("../models/ObjetJoueur");
const HerosJoueur = require("../models/HerosJoueur");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const {
  EMPLACEMENTS,
  RARETES,
  OBJETS,
  COUT_FABRICATION,
  trouverObjet,
  calculerStats,
  tirerObjet
} = require("../config/equipements");
const { trouverHeros } = require("../config/heros");

const router = express.Router();

function enrichir(objet) {
  const fiche = trouverObjet(objet.codeObjet);
  return {
    ...objet,
    nom: fiche?.nom || objet.codeObjet,
    emplacement: fiche?.emplacement || "arme",
    description: fiche?.description || "",
    stats: calculerStats(objet.codeObjet, objet.rarete, objet.niveau)
  };
}

// Inventaire complet + catalogue
router.get("/", async (req, res) => {
  const objets = await ObjetJoueur.find({ joueur: req.user._id }).lean();
  const heros = await HerosJoueur.find({ joueur: req.user._id }).lean();

  const ville = await Ville.findOne({ proprietaire: req.user._id });
  if (ville) await rafraichirVille(ville);
  const niveauForge = ville?.batiments?.find((b) => b.type === "forge")?.niveau ?? 0;

  res.json({
    emplacements: EMPLACEMENTS,
    raretes: RARETES,
    catalogue: OBJETS,
    objets: objets.map(enrichir),
    heros: heros.map((h) => ({
      _id: h._id,
      codeHeros: h.codeHeros,
      nom: trouverHeros(h.codeHeros)?.nom || h.codeHeros,
      niveau: h.niveau
    })),
    niveauForge,
    coutFabrication: COUT_FABRICATION,
    ressources: ville?.ressources || {}
  });
});

// Fabriquer un objet a la Forge
router.post("/fabriquer", async (req, res) => {
  try {
    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    const niveauForge = ville.batiments?.find((b) => b.type === "forge")?.niveau ?? 0;
    if (niveauForge < 1) {
      return res.status(400).json({ erreur: "Il te faut une Forge pour fabriquer un equipement" });
    }

    for (const [ressource, quantite] of Object.entries(COUT_FABRICATION)) {
      if ((ville.ressources[ressource] ?? 0) < quantite) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: COUT_FABRICATION });
      }
    }

    for (const [ressource, quantite] of Object.entries(COUT_FABRICATION)) {
      ville.ressources[ressource] -= quantite;
      await MouvementRessource.create({
        joueur: req.user._id,
        type: ressource,
        quantite: -quantite,
        origine: "construction",
        soldeApres: ville.ressources[ressource]
      });
    }
    await ville.save();

    const tirage = tirerObjet(niveauForge);
    const objet = await ObjetJoueur.create({
      joueur: req.user._id,
      codeObjet: tirage.code,
      rarete: tirage.rarete
    });

    const fiche = trouverObjet(tirage.code);
    res.status(201).json({
      message: `${fiche.nom} (${RARETES[tirage.rarete].nom}) sort de la forge !`,
      objet: enrichir(objet.toObject()),
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Equiper un objet sur un heros
router.post("/:id/equiper", async (req, res) => {
  try {
    const { herosId } = req.body || {};

    const objet = await ObjetJoueur.findOne({ _id: req.params.id, joueur: req.user._id });
    if (!objet) return res.status(404).json({ erreur: "Objet introuvable" });

    const heros = await HerosJoueur.findOne({ _id: herosId, joueur: req.user._id });
    if (!heros) return res.status(404).json({ erreur: "Heros introuvable" });

    const fiche = trouverObjet(objet.codeObjet);

    // Un seul objet par emplacement : on retire l'ancien
    const objetsDuHeros = await ObjetJoueur.find({ joueur: req.user._id, equipeSur: heros._id });
    for (const autre of objetsDuHeros) {
      const ficheAutre = trouverObjet(autre.codeObjet);
      if (ficheAutre?.emplacement === fiche.emplacement) {
        autre.equipeSur = null;
        await autre.save();
      }
    }

    objet.equipeSur = heros._id;
    await objet.save();

    res.json({ message: `${fiche.nom} equipe sur ${trouverHeros(heros.codeHeros)?.nom || "ce heros"}` });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Retirer un objet
router.post("/:id/retirer", async (req, res) => {
  const objet = await ObjetJoueur.findOne({ _id: req.params.id, joueur: req.user._id });
  if (!objet) return res.status(404).json({ erreur: "Objet introuvable" });
  objet.equipeSur = null;
  await objet.save();
  res.json({ message: "Objet retire" });
});

// Recycler un objet contre des ressources
router.delete("/:id", async (req, res) => {
  try {
    const objet = await ObjetJoueur.findOne({ _id: req.params.id, joueur: req.user._id });
    if (!objet) return res.status(404).json({ erreur: "Objet introuvable" });
    if (objet.equipeSur) {
      return res.status(400).json({ erreur: "Retire d'abord cet objet de ton heros" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (ville) {
      await rafraichirVille(ville);
      // On recupere la moitie du cout, module par la rarete
      const mult = RARETES[objet.rarete]?.multiplicateur || 1;
      for (const [ressource, quantite] of Object.entries(COUT_FABRICATION)) {
        const rendu = Math.round((quantite / 2) * mult);
        ville.ressources[ressource] = (ville.ressources[ressource] || 0) + rendu;
        await MouvementRessource.create({
          joueur: req.user._id,
          type: ressource,
          quantite: rendu,
          origine: "production",
          soldeApres: ville.ressources[ressource]
        });
      }
      await ville.save();
    }

    await ObjetJoueur.findByIdAndDelete(objet._id);
    res.json({ message: "Objet recycle", ressources: ville?.ressources });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
