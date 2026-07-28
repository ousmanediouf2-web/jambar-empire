const mongoose = require("mongoose");

// Un heros possede par un joueur (instance), distinct du catalogue.
const herosJoueurSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  codeHeros: { type: String, required: true },
  niveau: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  etoiles: { type: Number, default: 1 },
  assigneA: { type: mongoose.Schema.Types.ObjectId, ref: "Ville", default: null },
  dateRecrutement: { type: Date, default: Date.now }
});

herosJoueurSchema.index({ joueur: 1, codeHeros: 1 });

module.exports = mongoose.model("HerosJoueur", herosJoueurSchema);
