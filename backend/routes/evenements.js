const express = require("express");
const { bonusActifs } = require("../services/evenements");
const Evenement = require("../models/Evenement");

const router = express.Router();

// Evenements en cours, avec leurs effets reels
router.get("/", async (req, res) => {
  const bonus = await bonusActifs();
  res.json(bonus);
});

// Evenements a venir (annonces)
router.get("/a-venir", async (req, res) => {
  const maintenant = new Date();
  const evenements = await Evenement.find({
    actif: true,
    dateDebut: { $gt: maintenant }
  })
    .sort({ dateDebut: 1 })
    .limit(10)
    .lean();
  res.json(evenements);
});

module.exports = router;
