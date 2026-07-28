const express = require("express");
const Offre = require("../../models/Offre");
const MoyenPaiement = require("../../models/MoyenPaiement");

const router = express.Router();

router.get("/", async (req, res) => {
  const offres = await Offre.find().sort({ ordreAffichage: 1 });
  res.json(offres);
});

router.post("/", async (req, res) => {
  const offre = await Offre.create(req.body);
  res.status(201).json(offre);
});

router.put("/:id", async (req, res) => {
  const offre = await Offre.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(offre);
});

router.delete("/:id", async (req, res) => {
  await Offre.findByIdAndDelete(req.params.id);
  res.json({ message: "Offre supprimee" });
});

router.get("/moyens-paiement", async (req, res) => {
  const moyens = await MoyenPaiement.find();
  res.json(moyens);
});

router.put("/moyens-paiement/:id", async (req, res) => {
  const moyen = await MoyenPaiement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(moyen);
});

module.exports = router;
