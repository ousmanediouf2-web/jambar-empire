const mongoose = require("mongoose");

const moyenPaiementSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  actif: { type: Boolean, default: true },
  fournisseur: { type: String, enum: ["cinetpay", "paytech", "stripe"], required: true },
  fraisPourcent: { type: Number, default: 0 }
});

module.exports = mongoose.model("MoyenPaiement", moyenPaiementSchema);
