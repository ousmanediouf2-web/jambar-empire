const mongoose = require("mongoose");

// Une armee en deplacement sur la carte du continent.
// Etats : aller -> collecte -> retour -> terminee
const marcheSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  ville: { type: mongoose.Schema.Types.ObjectId, ref: "Ville", required: true },
  tile: { type: mongoose.Schema.Types.ObjectId, ref: "Tile", default: null },

  type: { type: String, enum: ["collecte"], default: "collecte" },
  etat: { type: String, enum: ["aller", "collecte", "retour", "terminee"], default: "aller" },

  origine: { x: Number, y: Number },
  destination: { x: Number, y: Number },

  armee: { type: mongoose.Schema.Types.Mixed, required: true },
  capaciteCharge: { type: Number, default: 0 },

  ressourceCiblee: { type: String, default: null },
  quantitePrevue: { type: Number, default: 0 },

  dateDepart: { type: Date, default: Date.now },
  dateArrivee: { type: Date, required: true },
  dateFinCollecte: { type: Date, required: true },
  dateRetour: { type: Date, required: true }
});

marcheSchema.index({ joueur: 1, etat: 1 });

module.exports = mongoose.model("Marche", marcheSchema);
