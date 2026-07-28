const express = require("express");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const { populationMax } = require("../config/batiments");
const Joueur = require("../models/Joueur");
const { bonusRecherches, reduction } = require("../config/recherches");
const {
  TROUPES_CONFIG,
  PALIERS,
  palierMax,
  infosPalier,
  calculerStatsTroupe,
  calculerCoutTotal,
  calculerDureeSecondes,
  capaciteLot
} = require("../config/troupes");

const router = express.Router();

async function finaliserEntrainements(ville) {
  const maintenant = new Date();
  const restants = [];
  let modifie = false;

  for (const lot of ville.fileEntrainement) {
    if (lot.finEntrainement && lot.finEntrainement <= maintenant) {
      ville.armee[lot.type] = (ville.armee[lot.type] || 0) + lot.quantite;
      modifie = true;
    } else {
      restants.push(lot);
    }
  }

  if (modifie) {
    ville.fileEntrainement = restants;
    await ville.save();
  }
  return ville;
}

function niveauBatiment(ville, type) {
  return ville.batiments?.find((b) => b.type === type)?.niveau ?? 0;
}

router.get("/", async (req, res) => {
  const ville = await Ville.findOne({ proprietaire: req.user._id });
  if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

  await finaliserEntrainements(ville);
  await rafraichirVille(ville);

  const nivCaserne = niveauBatiment(ville, "caserne") || 1;
  const nivForge = niveauBatiment(ville, "forge");
  const palier = palierMax(nivCaserne);

  const types = Object.entries(TROUPES_CONFIG).map(([code, config]) => {
    const nivRequis = niveauBatiment(ville, config.batimentRequis);
    return {
      code,
      nom: config.nom,
      categorie: config.categorie,
      description: config.description,
      batimentRequis: config.batimentRequis,
      debloque: nivRequis >= 1,
      coutUnitaire: calculerCoutTotal(code, 1, palier),
      dureeUnitaireSecondes: config.dureeUnitaireSecondes,
      fort: config.fort,
      faible: config.faible,
      stats: calculerStatsTroupe(code, palier)
    };
  });

  const popUtilisee = Object.entries(ville.armee.toObject ? ville.armee.toObject() : ville.armee)
    .filter(([c]) => c !== "_id")
    .reduce((t, [code, q]) => t + (q || 0) * (TROUPES_CONFIG[code]?.base.population || 1), 0);

  res.json({
    armee: ville.armee,
    populationMax: populationMax(ville),
    populationUtilisee: popUtilisee,
    fileEntrainement: ville.fileEntrainement,
    ressources: ville.ressources,
    niveauCaserne: nivCaserne,
    niveauForge: nivForge,
    palier,
    palierNom: infosPalier(palier).nom,
    paliers: PALIERS,
    capaciteLot: capaciteLot(nivCaserne),
    types
  });
});

router.post("/entrainer", async (req, res) => {
  try {
    const { type, quantite } = req.body || {};
    const config = TROUPES_CONFIG[type];
    if (!config) return res.status(400).json({ erreur: "Type de troupe inconnu" });

    const nombre = Number(quantite);
    if (!Number.isInteger(nombre) || nombre <= 0) {
      return res.status(400).json({ erreur: "Quantite invalide" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

    await finaliserEntrainements(ville);
    await rafraichirVille(ville);

    if (niveauBatiment(ville, config.batimentRequis) < 1) {
      return res.status(400).json({
        erreur: `Cette unite necessite le batiment : ${config.batimentRequis}`
      });
    }

    const nivCaserne = niveauBatiment(ville, "caserne") || 1;
    const palier = palierMax(nivCaserne);
    const maxLot = capaciteLot(nivCaserne);

    if (nombre > maxLot) {
      return res.status(400).json({
        erreur: `Ta caserne de niveau ${nivCaserne} ne peut former que ${maxLot} unites par lot`
      });
    }

    if (ville.fileEntrainement.length >= 2) {
      return res.status(400).json({ erreur: "Deux lots sont deja en cours de formation" });
    }

    // La population loge les troupes : sans Habitations, l'armee est plafonnee
    const popMax = populationMax(ville);
    const armeeObj = ville.armee.toObject ? ville.armee.toObject() : ville.armee;
    let popUtilisee = Object.entries(armeeObj)
      .filter(([c]) => c !== "_id")
      .reduce((t, [code, q]) => t + (q || 0) * (TROUPES_CONFIG[code]?.base.population || 1), 0);
    for (const lot of ville.fileEntrainement) {
      popUtilisee += lot.quantite * (TROUPES_CONFIG[lot.type]?.base.population || 1);
    }
    const popDemandee = nombre * (config.base.population || 1);

    if (popUtilisee + popDemandee > popMax) {
      return res.status(400).json({
        erreur: `Population insuffisante : ${popUtilisee}/${popMax} occupee, il en faut ${popDemandee} de plus. Construis ou ameliore des Habitations.`
      });
    }

    const cout = calculerCoutTotal(type, nombre, palier);
    for (const [ressource, quantiteRequise] of Object.entries(cout)) {
      if ((ville.ressources[ressource] ?? 0) < quantiteRequise) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: cout });
      }
    }

    for (const [ressource, quantiteRequise] of Object.entries(cout)) {
      ville.ressources[ressource] -= quantiteRequise;
      await MouvementRessource.create({
        joueur: req.user._id,
        type: ressource,
        quantite: -quantiteRequise,
        origine: "construction",
        soldeApres: ville.ressources[ressource]
      });
    }

    const joueurComplet = await Joueur.findById(req.user._id).select("recherches");
    const bonusTech = bonusRecherches(joueurComplet?.recherches);
    const duree = Math.max(1, Math.round(
      calculerDureeSecondes(type, nombre, nivCaserne, palier) * reduction(bonusTech, "vitesse_entrainement")
    ));
    ville.fileEntrainement.push({
      type,
      quantite: nombre,
      finEntrainement: new Date(Date.now() + duree * 1000)
    });

    await ville.save();

    res.json({
      message: `${nombre} ${config.nom} en formation`,
      fileEntrainement: ville.fileEntrainement,
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
