const mongoose = require("mongoose");

const offreSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, default: "" },
  prix: { type: Number, required: true },
  contenu: {
    argent: { type: Number, default: 0 },
    or: { type: Number, default: 0 },
    bois: { type: Number, default: 0 },
    fer: { type: Number, default: 0 },
    pierre: { type: Number, default: 0 },
    ble: { type: Number, default: 0 },
    accelerations: { type: Number, default: 0 }
  },
  visible: { type: Boolean, default: true },
  ordreAffichage: { type: Number, default: 0 }
});

module.exports = mongoose.model("Offre", offreSchema);
