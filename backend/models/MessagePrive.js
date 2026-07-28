const mongoose = require("mongoose");

const messagePriveSchema = new mongoose.Schema({
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  nomExpediteur: { type: String, required: true },
  destinataire: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  nomDestinataire: { type: String, required: true },
  sujet: { type: String, default: "(sans sujet)", maxlength: 120 },
  contenu: { type: String, required: true, maxlength: 2000 },
  lu: { type: Boolean, default: false },
  supprimeParExpediteur: { type: Boolean, default: false },
  supprimeParDestinataire: { type: Boolean, default: false },
  dateCreation: { type: Date, default: Date.now }
});

messagePriveSchema.index({ destinataire: 1, dateCreation: -1 });
messagePriveSchema.index({ expediteur: 1, dateCreation: -1 });

module.exports = mongoose.model("MessagePrive", messagePriveSchema);
