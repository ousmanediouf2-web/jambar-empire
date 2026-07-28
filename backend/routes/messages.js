const express = require("express");
const rateLimit = require("express-rate-limit");
const MessagePrive = require("../models/MessagePrive");
const Joueur = require("../models/Joueur");

const router = express.Router();

// Limite anti-spam sur l'envoi de messages
const limiteurEnvoi = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { erreur: "Trop de messages envoyes, patiente une minute" }
});

// Boite de reception
router.get("/recus", async (req, res) => {
  const messages = await MessagePrive.find({
    destinataire: req.user._id,
    supprimeParDestinataire: false
  })
    .sort({ dateCreation: -1 })
    .limit(50)
    .lean();

  const nonLus = await MessagePrive.countDocuments({
    destinataire: req.user._id,
    supprimeParDestinataire: false,
    lu: false
  });

  res.json({ messages, nonLus });
});

// Messages envoyes
router.get("/envoyes", async (req, res) => {
  const messages = await MessagePrive.find({
    expediteur: req.user._id,
    supprimeParExpediteur: false
  })
    .sort({ dateCreation: -1 })
    .limit(50)
    .lean();
  res.json(messages);
});

// Envoyer un message
router.post("/envoyer", limiteurEnvoi, async (req, res) => {
  try {
    const { nomDestinataire, sujet, contenu } = req.body || {};

    const texte = String(contenu || "").trim();
    if (!texte) return res.status(400).json({ erreur: "Message vide" });
    if (texte.length > 2000) return res.status(400).json({ erreur: "Message trop long (2000 caracteres max)" });

    const destinataire = await Joueur.findOne({ nom: String(nomDestinataire || "").trim() });
    if (!destinataire) return res.status(404).json({ erreur: "Ce souverain n'existe pas" });
    if (String(destinataire._id) === String(req.user._id)) {
      return res.status(400).json({ erreur: "Tu ne peux pas t'ecrire a toi-meme" });
    }

    const message = await MessagePrive.create({
      expediteur: req.user._id,
      nomExpediteur: req.user.nom,
      destinataire: destinataire._id,
      nomDestinataire: destinataire.nom,
      sujet: String(sujet || "").trim().slice(0, 120) || "(sans sujet)",
      contenu: texte
    });

    res.status(201).json({ message: `Message envoye a ${destinataire.nom}`, id: message._id });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Marquer comme lu
router.put("/:id/lu", async (req, res) => {
  const message = await MessagePrive.findOneAndUpdate(
    { _id: req.params.id, destinataire: req.user._id },
    { lu: true },
    { new: true }
  );
  if (!message) return res.status(404).json({ erreur: "Message introuvable" });
  res.json({ message: "Marque comme lu" });
});

// Supprimer (de son cote uniquement)
router.delete("/:id", async (req, res) => {
  const message = await MessagePrive.findById(req.params.id);
  if (!message) return res.status(404).json({ erreur: "Message introuvable" });

  if (String(message.destinataire) === String(req.user._id)) {
    message.supprimeParDestinataire = true;
  } else if (String(message.expediteur) === String(req.user._id)) {
    message.supprimeParExpediteur = true;
  } else {
    return res.status(403).json({ erreur: "Ce message ne t'appartient pas" });
  }

  if (message.supprimeParDestinataire && message.supprimeParExpediteur) {
    await MessagePrive.findByIdAndDelete(message._id);
  } else {
    await message.save();
  }

  res.json({ message: "Message supprime" });
});

module.exports = router;
