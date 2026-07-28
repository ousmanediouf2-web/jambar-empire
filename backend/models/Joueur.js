const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const joueurSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  motDePasse: { type: String, required: true },
  role: { type: String, enum: ["joueur", "admin"], default: "joueur" },
  rang: {
    type: String,
    enum: ["roturier", "chevalier", "baron", "comte", "duc", "prince"],
    default: "roturier"
  },
  pointsPrestige: { type: Number, default: 0 },
  villesMax: { type: Number, default: 1 },
  villes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ville" }],
  alliance: { type: mongoose.Schema.Types.ObjectId, ref: "Alliance", default: null },
  recherches: [
    {
      code: { type: String },
      niveau: { type: Number, default: 0 },
      finRecherche: { type: Date, default: null }
    }
  ],
  banni: { type: Boolean, default: false },
  dateInscription: { type: Date, default: Date.now },
  derniereConnexion: { type: Date, default: Date.now }
});

joueurSchema.methods.verifierMotDePasse = async function (motDePasseSaisi) {
  return bcrypt.compare(motDePasseSaisi, this.motDePasse);
};

joueurSchema.pre("save", async function (next) {
  if (!this.isModified("motDePasse")) return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  next();
});

module.exports = mongoose.model("Joueur", joueurSchema);
