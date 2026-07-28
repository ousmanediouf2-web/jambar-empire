const express = require("express");
const Joueur = require("../../models/Joueur");
const MouvementRessource = require("../../models/MouvementRessource");
const LogActionAdmin = require("../../models/LogActionAdmin");
const Ville = require("../../models/Ville");

const router = express.Router();

router.get("/", async (req, res) => {
  const joueurs = await Joueur.find().select("-motDePasse").limit(200);
  res.json(joueurs);
});

router.get("/:id/historique", async (req, res) => {
  const mouvements = await MouvementRessource.find({ joueur: req.params.id })
    .sort({ dateCreation: -1 })
    .limit(200);
  res.json(mouvements);
});

router.put("/:id/ville/:villeId/ressources", async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.villeId);
    if (!ville) return res.status(404).json({ erreur: "Ville introuvable" });

    const avant = { ...ville.ressources.toObject() };

    for (const [type, nouvelleValeur] of Object.entries(req.body.ressources || {})) {
      const diff = nouvelleValeur - ville.ressources[type];
      if (diff !== 0) {
        await MouvementRessource.create({
          joueur: ville.proprietaire,
          type,
          quantite: diff,
          origine: "edition_admin",
          effectuePar: req.user._id,
          soldeApres: nouvelleValeur
        });
      }
    }

    ville.ressources = { ...ville.ressources.toObject(), ...req.body.ressources };
    await ville.save();

    await LogActionAdmin.create({
      admin: req.user._id,
      action: "modif_ressources",
      cible: ville._id,
      avant,
      apres: ville.ressources,
      ip: req.ip
    });

    res.json(ville);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.put("/:id/ville/:villeId/armee", async (req, res) => {
  try {
    const ville = await Ville.findById(req.params.villeId);
    if (!ville) return res.status(404).json({ erreur: "Ville introuvable" });

    const avant = { ...ville.armee.toObject() };
    ville.armee = { ...ville.armee.toObject(), ...req.body.armee };
    await ville.save();

    await LogActionAdmin.create({
      admin: req.user._id,
      action: "modif_armee",
      cible: ville._id,
      avant,
      apres: ville.armee,
      ip: req.ip
    });

    res.json(ville);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.put("/:id/bannir", async (req, res) => {
  const joueur = await Joueur.findByIdAndUpdate(
    req.params.id,
    { banni: req.body.banni },
    { new: true }
  ).select("-motDePasse");

  await LogActionAdmin.create({
    admin: req.user._id,
    action: joueur.banni ? "ban_joueur" : "debannir_joueur",
    cible: joueur._id,
    ip: req.ip
  });

  res.json(joueur);
});

module.exports = router;
