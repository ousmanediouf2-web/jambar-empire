const mongoose = require("mongoose");

// Country City (CC) - departements a l'interieur d'une region
const countryCitySchema = new mongoose.Schema({
  nom: { type: String, required: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
  coordonnees: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
});

module.exports = mongoose.model("CountryCity", countryCitySchema);
