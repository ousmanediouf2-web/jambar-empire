const mongoose = require("mongoose");

const rapportBatailleSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  ville: { type: mongoose.Schema.Types.ObjectId, ref: "Ville" },
  typeCible: { type: String, enum: ["camp_ennemi", "joueur"], default: "camp_ennemi" },
  nomCible: { type: String },
  niveauCible: { type: Number },
  victoire: { type: Boolean, required: true },
  tours: { type: Number },
  armeeEnvoyee: { type: mongoose.Schema.Types.Mixed },
  pertesAttaquant: { type: mongoose.Schema.Types.Mixed },
  pertesDefenseur: { type: mongoose.Schema.Types.Mixed },
  survivants: { type: mongoose.Schema.Types.Mixed },
  butin: { type: mongoose.Schema.Types.Mixed },
  herosUtilise: { type: String, default: null },
  experienceGagnee: { type: Number, default: 0 },
  dateCreation: { type: Date, default: Date.now }
});

rapportBatailleSchema.index({ joueur: 1, dateCreation: -1 });

module.exports = mongoose.model("RapportBataille", rapportBatailleSchema);
