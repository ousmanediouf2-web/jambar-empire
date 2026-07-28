const mongoose = require("mongoose");

// Province City (PC) - les 15 regions de la Senegambie
const regionSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  estCapitale: { type: Boolean, default: false },
  bonusRessource: { type: String, default: null },
  coordonnees: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  proprietairePalais: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", default: null },
  allianceProprietaire: { type: mongoose.Schema.Types.ObjectId, ref: "Alliance", default: null },
  tauxImposition: { type: Number, default: 0, min: 0, max: 30 },
  countryCities: [{ type: mongoose.Schema.Types.ObjectId, ref: "CountryCity" }]
});

module.exports = mongoose.model("Region", regionSchema);
