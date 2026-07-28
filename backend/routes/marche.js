const express = require("express");
const Marche = require("../models/Marche");
const Ville = require("../models/Ville");
const Tile = require("../models/Tile");
const MouvementRessource = require("../models/MouvementRessource");
const { TROUPES_CONFIG, palierMax } = require("../config/troupes");
const { rafraichirVille } = require("../services/production");
const Joueur = require("../models/Joueur");
const { bonusRecherches, reduction } = require("../config/recherches");
const { marchesMax, bonusCharge } = require("../config/batiments");
const {
  MARCHES_MAX,
  distanceEntre,
  vitesseArmee,
  capaciteChargeArmee,
  dureeTrajetSecondes,
  dureeCollecteSecondes
} = require("../config/marche");

const router = express.Router();

function niveauBatiment(ville, type) {
  return ville.batiments?.find((b) => b.type === type)?.niveau ?? 0;
}

// Fait avancer toutes les marches du joueur selon l'horloge du serveur.
// Rend les troupes et livre les ressources quand l'armee est rentree.
async function finaliserMarches(joueurId) {
  const maintenant = new Date();
  const marches = await Marche.find({ joueur: joueurId, etat: { $ne: "terminee" } });
  if (marches.length === 0) return [];

  const livraisons = [];

  for (const marche of marches) {
    if (marche.dateRetour <= maintenant) {
      const ville = await Ville.findById(marche.ville);
      if (ville) {
        // Les troupes rentrent a la garnison
        for (const [type, quantite] of Object.entries(marche.armee)) {
          ville.armee[type] = (ville.armee[type] || 0) + quantite;
        }

        // Les ressources recoltees sont livrees
        if (marche.ressourceCiblee && marche.quantitePrevue > 0) {
          const ressource = marche.ressourceCiblee;
          ville.ressources[ressource] = (ville.ressources[ressource] || 0) + marche.quantitePrevue;

          await MouvementRessource.create({
            joueur: joueurId,
            type: ressource,
            quantite: marche.quantitePrevue,
            origine: "production",
            soldeApres: ville.ressources[ressource]
          });

          livraisons.push({
            ressource,
            quantite: marche.quantitePrevue,
            destination: marche.destination
          });
        }

        await ville.save();
      }

      marche.etat = "terminee";
      await marche.save();
    } else if (marche.dateFinCollecte <= maintenant && marche.etat !== "retour") {
      marche.etat = "retour";
      await marche.save();
    } else if (marche.dateArrivee <= maintenant && marche.etat === "aller") {
      marche.etat = "collecte";
      await marche.save();
    }
  }

  return livraisons;
}

// Marches en cours du joueur
router.get("/", async (req, res) => {
  const livraisons = await finaliserMarches(req.user._id);
  const marches = await Marche.find({
    joueur: req.user._id,
    etat: { $ne: "terminee" }
  }).lean();

  res.json({ marches, livraisons, marchesMax: MARCHES_MAX });
});

// Envoyer une armee recolter sur une case
router.post("/collecter", async (req, res) => {
  try {
    const { tileId, troupes } = req.body || {};

    await finaliserMarches(req.user._id);

    const enCours = await Marche.countDocuments({
      joueur: req.user._id,
      etat: { $ne: "terminee" }
    });
    const villePourLimite = await Ville.findOne({ proprietaire: req.user._id });
    const limiteMarches = villePourLimite ? marchesMax(villePourLimite) : MARCHES_MAX;
    if (enCours >= limiteMarches) {
      return res.status(400).json({
        erreur: `Tu ne peux mener que ${limiteMarches} armees a la fois. Ameliore la Salle des Commandants.`
      });
    }

    const tile = await Tile.findById(tileId);
    if (!tile) return res.status(404).json({ erreur: "Case introuvable" });
    if (!tile.ressource) {
      return res.status(400).json({ erreur: "Cette case ne produit aucune ressource" });
    }
    if (tile.proprietaire) {
      return res.status(400).json({ erreur: "Cette case est deja occupee" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

    await rafraichirVille(ville);

    // Verification stricte des troupes envoyees
    const armee = {};
    let total = 0;
    for (const [type, valeurBrute] of Object.entries(troupes || {})) {
      const quantite = Number(valeurBrute);
      if (!Number.isInteger(quantite) || quantite <= 0) continue;
      if (!TROUPES_CONFIG[type]) {
        return res.status(400).json({ erreur: `Type de troupe inconnu : ${type}` });
      }
      if ((ville.armee[type] || 0) < quantite) {
        return res.status(400).json({
          erreur: `Tu n'as que ${ville.armee[type] || 0} ${TROUPES_CONFIG[type].nom} en garnison`
        });
      }
      armee[type] = quantite;
      total += quantite;
    }

    if (total === 0) {
      return res.status(400).json({ erreur: "Selectionne au moins une unite a envoyer" });
    }

    const joueurComplet = await Joueur.findById(req.user._id).select("recherches");
    const bonusTech = bonusRecherches(joueurComplet?.recherches);
    const palier = palierMax(niveauBatiment(ville, "caserne") || 1);
    const capacite = Math.round(capaciteChargeArmee(armee, palier) * (1 + (bonusTech.charge || 0) / 100) * bonusCharge(ville));
    if (capacite <= 0) {
      return res.status(400).json({ erreur: "Ces unites ne peuvent rien transporter" });
    }

    const origine = { x: ville.coordonnees.x, y: ville.coordonnees.y };
    const destination = { x: tile.x, y: tile.y };

    const dureeAller = Math.max(5, Math.round(
      dureeTrajetSecondes(origine, destination, armee) * reduction(bonusTech, "vitesse_marche")
    ));
    const dureeCollecte = dureeCollecteSecondes(capacite);

    const maintenant = Date.now();
    const dateArrivee = new Date(maintenant + dureeAller * 1000);
    const dateFinCollecte = new Date(dateArrivee.getTime() + dureeCollecte * 1000);
    const dateRetour = new Date(dateFinCollecte.getTime() + dureeAller * 1000);

    // Les troupes quittent la garnison
    for (const [type, quantite] of Object.entries(armee)) {
      ville.armee[type] -= quantite;
    }
    await ville.save();

    const marche = await Marche.create({
      joueur: req.user._id,
      ville: ville._id,
      tile: tile._id,
      type: "collecte",
      etat: "aller",
      origine,
      destination,
      armee,
      capaciteCharge: capacite,
      ressourceCiblee: tile.ressource,
      quantitePrevue: capacite,
      dateArrivee,
      dateFinCollecte,
      dateRetour
    });

    res.status(201).json({
      marche,
      armee: ville.armee,
      resume: {
        distance: Math.round(distanceEntre(origine, destination)),
        vitesse: vitesseArmee(armee),
        dureeAllerSecondes: dureeAller,
        dureeCollecteSecondes: dureeCollecte,
        dureeTotaleSecondes: dureeAller * 2 + dureeCollecte
      }
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
