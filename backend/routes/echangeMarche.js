const express = require("express");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille, niveauBatiment } = require("../services/production");
const { tauxEchange } = require("../config/batiments");

const router = express.Router();

const ECHANGEABLES = ["ble", "bois", "pierre", "fer", "argent"];

// Le Marche : echanger une ressource contre une autre.
// Le taux depend du niveau du Marche (plus il est haut, moins on perd).
router.get("/", async (req, res) => {
  const ville = await Ville.findOne({ proprietaire: req.user._id });
  if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
  await rafraichirVille(ville);

  const niveau = niveauBatiment(ville, "marche");
  const taux = tauxEchange(niveau);

  res.json({
    niveauMarche: niveau,
    taux: Math.round(taux * 100),
    ressources: ville.ressources,
    echangeables: ECHANGEABLES
  });
});

router.post("/echanger", async (req, res) => {
  try {
    const { donne, recoit, quantite } = req.body || {};
    if (!ECHANGEABLES.includes(donne) || !ECHANGEABLES.includes(recoit)) {
      return res.status(400).json({ erreur: "Ressource non echangeable" });
    }
    if (donne === recoit) return res.status(400).json({ erreur: "Choisis deux ressources differentes" });

    const montant = Number(quantite);
    if (!Number.isInteger(montant) || montant <= 0) {
      return res.status(400).json({ erreur: "Quantite invalide" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    const niveau = niveauBatiment(ville, "marche");
    if (niveau < 1) return res.status(400).json({ erreur: "Construis un Marche pour echanger des ressources" });

    if ((ville.ressources[donne] ?? 0) < montant) {
      return res.status(400).json({ erreur: "Ressources insuffisantes" });
    }

    const taux = tauxEchange(niveau);
    const gain = Math.floor(montant * taux);

    ville.ressources[donne] -= montant;
    ville.ressources[recoit] += gain;
    await ville.save();

    await MouvementRessource.create({
      joueur: req.user._id, type: donne, quantite: -montant,
      origine: "transfert_alliance", soldeApres: ville.ressources[donne]
    });
    await MouvementRessource.create({
      joueur: req.user._id, type: recoit, quantite: gain,
      origine: "transfert_alliance", soldeApres: ville.ressources[recoit]
    });

    res.json({
      message: `${montant} ${donne} echanges contre ${gain} ${recoit}`,
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
