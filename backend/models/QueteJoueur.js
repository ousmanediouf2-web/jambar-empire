const mongoose = require("mongoose");

const queteJoueurSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  code: { type: String, required: true },
  nbReclamations: { type: Number, default: 0 },
  derniereReclamation: { type: Date, default: null }
});

queteJoueurSchema.index({ joueur: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("QueteJoueur", queteJoueurSchema);
