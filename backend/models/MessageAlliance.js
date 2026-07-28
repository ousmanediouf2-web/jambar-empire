const mongoose = require("mongoose");

const messageAllianceSchema = new mongoose.Schema({
  alliance: { type: mongoose.Schema.Types.ObjectId, ref: "Alliance", required: true },
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", default: null },
  nomAuteur: { type: String, required: true },
  contenu: { type: String, required: true, maxlength: 500 },
  systeme: { type: Boolean, default: false },
  dateCreation: { type: Date, default: Date.now }
});

messageAllianceSchema.index({ alliance: 1, dateCreation: -1 });

module.exports = mongoose.model("MessageAlliance", messageAllianceSchema);
