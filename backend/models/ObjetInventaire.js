const mongoose = require("mongoose");

// Objets consommables possedes par un joueur (accelerations, boucliers,
// coffres...). Distinct des equipements de heros (ObjetJoueur).
const objetInventaireSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  code: { type: String, required: true },
  quantite: { type: Number, default: 1, min: 0 }
});

objetInventaireSchema.index({ joueur: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("ObjetInventaire", objetInventaireSchema);
