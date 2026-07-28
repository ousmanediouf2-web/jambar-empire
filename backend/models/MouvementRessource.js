const mongoose = require("mongoose");

// Journal des mouvements de ressources - append-only, jamais modifie
const mouvementRessourceSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  type: { type: String, enum: ["argent", "bois", "ble", "pierre", "fer", "or"], required: true },
  quantite: { type: Number, required: true },
  origine: {
    type: String,
    enum: ["production", "achat", "butin_raid", "quete", "edition_admin", "transfert_alliance", "construction"],
    required: true
  },
  reference: { type: mongoose.Schema.Types.ObjectId, default: null },
  effectuePar: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", default: null },
  soldeApres: { type: Number, required: true },
  dateCreation: { type: Date, default: Date.now }
});

mouvementRessourceSchema.index({ joueur: 1, dateCreation: -1 });

module.exports = mongoose.model("MouvementRessource", mouvementRessourceSchema);
