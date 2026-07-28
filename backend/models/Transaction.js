const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  offre: { type: mongoose.Schema.Types.ObjectId, ref: "Offre", required: true },
  montant: { type: Number, required: true },
  moyenPaiement: { type: mongoose.Schema.Types.ObjectId, ref: "MoyenPaiement", required: true },
  statut: {
    type: String,
    enum: ["en_attente", "reussi", "echoue", "rembourse"],
    default: "en_attente"
  },
  referenceExterne: { type: String, default: null },
  dateCreation: { type: Date, default: Date.now },
  dateConfirmation: { type: Date, default: null }
});

module.exports = mongoose.model("Transaction", transactionSchema);
