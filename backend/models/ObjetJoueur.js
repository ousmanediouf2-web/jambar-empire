const mongoose = require("mongoose");

// Un objet d'equipement possede par un joueur
const objetJoueurSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  codeObjet: { type: String, required: true },
  rarete: { type: String, enum: ["commun", "rare", "epique", "legendaire", "mythique"], required: true },
  niveau: { type: Number, default: 1 },
  equipeSur: { type: mongoose.Schema.Types.ObjectId, ref: "HerosJoueur", default: null },
  dateCreation: { type: Date, default: Date.now }
});

objetJoueurSchema.index({ joueur: 1, equipeSur: 1 });

module.exports = mongoose.model("ObjetJoueur", objetJoueurSchema);
