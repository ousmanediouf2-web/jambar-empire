const mongoose = require("mongoose");

// Case de la grille superposee a la carte de la Senegambie
const tileSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  countryCity: { type: mongoose.Schema.Types.ObjectId, ref: "CountryCity", required: true },
  typeTerrain: {
    type: String,
    enum: ["vide", "foret", "prairie", "lac", "montagne", "colline"],
    required: true
  },
  ressource: {
    type: String,
    enum: ["bois", "ble", "fer", "pierre", null],
    default: null
  },
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", default: null },
  ville: { type: mongoose.Schema.Types.ObjectId, ref: "Ville", default: null }
});

tileSchema.index({ x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model("Tile", tileSchema);
