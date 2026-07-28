const mongoose = require("mongoose");

// Un camp ennemi reellement pose sur la carte du continent.
const campCarteSchema = new mongoose.Schema({
  niveau: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: "Region", default: null },
  vaincuPar: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", default: null },
  reapparitionLe: { type: Date, default: null }
});

campCarteSchema.index({ x: 1, y: 1 });

module.exports = mongoose.model("CampCarte", campCarteSchema);
