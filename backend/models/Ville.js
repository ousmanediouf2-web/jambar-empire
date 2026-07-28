const mongoose = require("mongoose");

const villeSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  countryCity: { type: mongoose.Schema.Types.ObjectId, ref: "CountryCity", required: true },
  coordonnees: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  ressources: {
    argent: { type: Number, default: 500 },
    bois: { type: Number, default: 500 },
    ble: { type: Number, default: 500 },
    pierre: { type: Number, default: 300 },
    fer: { type: Number, default: 100 },
    or: { type: Number, default: 0 }
  },
  armee: {
    ouvrier: { type: Number, default: 0 },
    milicien: { type: Number, default: 0 },
    eclaireur: { type: Number, default: 0 },
    lanciers: { type: Number, default: 0 },
    infanterie: { type: Number, default: 0 },
    archers: { type: Number, default: 0 },
    cavalerie: { type: Number, default: 0 },
    cavalerie_lourde: { type: Number, default: 0 },
    transporteur: { type: Number, default: 0 },
    baliste: { type: Number, default: 0 },
    belier: { type: Number, default: 0 },
    catapulte: { type: Number, default: 0 }
  },
  fileEntrainement: [
    {
      type: { type: String },
      quantite: { type: Number },
      finEntrainement: { type: Date }
    }
  ],
  batiments: [
    {
      type: { type: String },
      zone: { type: String, enum: ["interieur", "exterieur"], default: "interieur" },
      emplacement: { type: Number, default: 0 },
      niveau: { type: Number, default: 0 },
      finAmelioration: { type: Date, default: null }
    }
  ],
  protectionDebutantJusquA: { type: Date, default: null },
  protectionJusquA: { type: Date, default: null },
  derniereProduction: { type: Date, default: Date.now },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ville", villeSchema);
