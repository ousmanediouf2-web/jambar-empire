const mongoose = require("mongoose");

// Hierarchie de l'alliance, du plus haut au plus bas
const RANGS = ["roi", "general", "commandant", "officier", "membre"];

const allianceSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true, trim: true },
  tag: { type: String, required: true, unique: true, uppercase: true, maxlength: 5 },
  description: { type: String, default: "", maxlength: 500 },
  embleme: { type: String, default: "lion" },

  chef: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur", required: true },
  membres: [
    {
      joueur: { type: mongoose.Schema.Types.ObjectId, ref: "Joueur" },
      rang: { type: String, enum: RANGS, default: "membre" },
      contribution: { type: Number, default: 0 },
      dateAdhesion: { type: Date, default: Date.now }
    }
  ],

  membresMax: { type: Number, default: 30 },
  adhesionLibre: { type: Boolean, default: true },
  prestigeMinimum: { type: Number, default: 0 },

  // Tresor commun alimente par les dons des membres
  coffre: {
    ble: { type: Number, default: 0 },
    bois: { type: Number, default: 0 },
    pierre: { type: Number, default: 0 },
    fer: { type: Number, default: 0 },
    argent: { type: Number, default: 0 }
  },

  dateCreation: { type: Date, default: Date.now }
});

allianceSchema.statics.RANGS = RANGS;

module.exports = mongoose.model("Alliance", allianceSchema);
