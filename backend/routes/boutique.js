const express = require("express");
const Offre = require("../models/Offre");
const MoyenPaiement = require("../models/MoyenPaiement");
const Transaction = require("../models/Transaction");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const { bonusActifs } = require("../services/evenements");

const router = express.Router();

// Offres visibles + moyens de paiement actifs
router.get("/", async (req, res) => {
  const [offres, moyens] = await Promise.all([
    Offre.find({ visible: true }).sort({ ordreAffichage: 1 }).lean(),
    MoyenPaiement.find({ actif: true }).select("nom fournisseur").lean()
  ]);
  res.json({ offres, moyensPaiement: moyens });
});

// Mes transactions
router.get("/mes-achats", async (req, res) => {
  const transactions = await Transaction.find({ joueur: req.user._id })
    .populate("offre", "nom prix")
    .sort({ dateCreation: -1 })
    .limit(30)
    .lean();
  res.json(transactions);
});

// Demarrer un achat : cree une transaction en attente.
// Les ressources ne sont creditees QUE lorsque le fournisseur de paiement
// confirme via son webhook (voir /paiement/webhook).
router.post("/acheter", async (req, res) => {
  try {
    const { offreId, moyenPaiementId } = req.body || {};

    const offre = await Offre.findById(offreId);
    if (!offre || !offre.visible) return res.status(404).json({ erreur: "Offre introuvable" });

    const moyen = await MoyenPaiement.findById(moyenPaiementId);
    if (!moyen || !moyen.actif) return res.status(400).json({ erreur: "Moyen de paiement indisponible" });

    const transaction = await Transaction.create({
      joueur: req.user._id,
      offre: offre._id,
      montant: offre.prix,
      moyenPaiement: moyen._id,
      statut: "en_attente"
    });

    // A ce stade, il faudrait appeler l'API du fournisseur (CinetPay, PayTech...)
    // avec les cles configurees en variables d'environnement, puis renvoyer
    // l'URL de paiement au joueur. Sans cles configurees, la transaction
    // reste en attente et aucune ressource n'est creditee.
    const clesConfigurees = Boolean(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);

    res.status(201).json({
      transaction,
      paiementConfigure: clesConfigurees,
      message: clesConfigurees
        ? "Transaction creee, redirection vers le paiement"
        : "Transaction enregistree en attente. Le fournisseur de paiement n'est pas encore configure sur ce serveur."
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Livraison d'une transaction confirmee. Appelee par le webhook du
// fournisseur de paiement (a brancher quand les cles sont configurees).
async function livrerTransaction(transactionId) {
  const transaction = await Transaction.findById(transactionId).populate("offre");
  if (!transaction || transaction.statut === "reussi") return null;

  const ville = await Ville.findOne({ proprietaire: transaction.joueur });
  if (!ville) return null;

  await rafraichirVille(ville);

  const contenu = transaction.offre?.contenu || {};
  for (const [ressource, quantite] of Object.entries(contenu)) {
    if (!quantite || quantite <= 0) continue;
    if (ressource === "accelerations") continue;
    if (ville.ressources[ressource] === undefined) continue;

    ville.ressources[ressource] += quantite;
    await MouvementRessource.create({
      joueur: transaction.joueur,
      type: ressource,
      quantite,
      origine: "achat",
      reference: transaction._id,
      soldeApres: ville.ressources[ressource]
    });
  }

  await ville.save();

  transaction.statut = "reussi";
  transaction.dateConfirmation = new Date();
  await transaction.save();

  return transaction;
}

router.livrerTransaction = livrerTransaction;
module.exports = router;
