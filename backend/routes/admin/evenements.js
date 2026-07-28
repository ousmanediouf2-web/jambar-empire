const express = require("express");
const Evenement = require("../../models/Evenement");
const LogActionAdmin = require("../../models/LogActionAdmin");

const router = express.Router();

router.get("/", async (req, res) => {
  const evenements = await Evenement.find().sort({ dateDebut: -1 });
  res.json(evenements);
});

router.post("/", async (req, res) => {
  const evenement = await Evenement.create({ ...req.body, creePar: req.user._id });
  await LogActionAdmin.create({
    admin: req.user._id,
    action: "creation_evenement",
    cible: evenement._id,
    apres: evenement,
    ip: req.ip
  });
  res.status(201).json(evenement);
});

router.put("/:id", async (req, res) => {
  const evenement = await Evenement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(evenement);
});

router.delete("/:id", async (req, res) => {
  await Evenement.findByIdAndDelete(req.params.id);
  res.json({ message: "Evenement supprime" });
});

module.exports = router;
