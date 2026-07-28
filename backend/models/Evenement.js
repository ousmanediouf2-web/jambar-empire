const mongoose = require("mongoose");

const evenementSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: { type: String, default: "" },
  type: {
    type: String,
    enum: ["bonus_production", "double_xp", "tournoi", "bataille_speciale"],
    required: true
  },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  actif: { type: Boolean, default: true },
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true }
});

module.exports = mongoose.model("Evenement", evenementSchema);
