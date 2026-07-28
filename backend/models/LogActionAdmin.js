const mongoose = require("mongoose");

const logActionAdminSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  action: { type: String, required: true },
  cible: { type: mongoose.Schema.Types.ObjectId, default: null },
  avant: { type: mongoose.Schema.Types.Mixed },
  apres: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LogActionAdmin", logActionAdminSchema);
