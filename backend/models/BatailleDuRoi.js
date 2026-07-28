const mongoose = require("mongoose");

const batailleDuRoiSchema = new mongoose.Schema({
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  participants: [
    {
      alliance: { type: mongoose.Schema.Types.ObjectId, ref: "Alliance" },
      troupesEnvoyees: { type: Number, default: 0 }
    }
  ],
  vainqueur: { type: mongoose.Schema.Types.ObjectId, ref: "Alliance", default: null },
  statut: {
    type: String,
    enum: ["en_attente", "en_cours", "terminee"],
    default: "en_attente"
  }
});

module.exports = mongoose.model("BatailleDuRoi", batailleDuRoiSchema);
