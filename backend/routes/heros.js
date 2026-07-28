const express = require("express");
const HerosJoueur = require("../models/HerosJoueur");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const {
  CATALOGUE_HEROS,
  RARETES,
  COUT_RECRUTEMENT,
  COUT_INVOCATION_OR,
  trouverHeros,
  tirerHerosAleatoire,
  calculerStats
} = require("../config/heros");

const router = express.Router();

// Catalogue complet (pour la galerie / encyclopedie)
router.get("/catalogue", async (req, res) => {
  const villeJoueur = await Ville.findOne({ proprietaire: req.user._id });
  const niveauTaverne = villeJoueur?.batiments?.find((b) => b.type === "taverne")?.niveau ?? 0;
  res.json({
    raretes: RARETES,
    heros: CATALOGUE_HEROS.map((h) => ({
      code: h.code,
      nom: h.nom,
      rarete: h.rarete,
      specialite: h.specialite,
      typeFavori: h.typeFavori,
      histoire: h.histoire,
      statsNiveau1: calculerStats(h.code, 1)
    })),
    coutRecrutement: COUT_RECRUTEMENT,
    coutInvocationOr: COUT_INVOCATION_OR,
    niveauTaverne
  });
});

// Les heros possedes par le joueur connecte
router.get("/mes-heros", async (req, res) => {
  const mesHeros = await HerosJoueur.find({ joueur: req.user._id }).lean();
  const enrichis = mesHeros.map((h) => {
    const fiche = trouverHeros(h.codeHeros);
    return {
      ...h,
      nom: fiche?.nom || h.codeHeros,
      rarete: fiche?.rarete || "commun",
      specialite: fiche?.specialite || "",
      typeFavori: fiche?.typeFavori || "",
      histoire: fiche?.histoire || "",
      stats: calculerStats(h.codeHeros, h.niveau)
    };
  });
  res.json(enrichis);
});

// Recruter un heros (tirage aleatoire). premium=true => paye en or, meilleures chances.
router.post("/recruter", async (req, res) => {
  try {
    const premium = req.body?.premium === true;

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

    const niveauTaverne = ville.batiments?.find((b) => b.type === "taverne")?.niveau ?? 0;
    if (niveauTaverne < 1) {
      return res.status(400).json({ erreur: "Construis une Taverne des Heros pour recruter" });
    }

    const ressourceUtilisee = premium ? "or" : "argent";
    const coutRequis = premium ? COUT_INVOCATION_OR : COUT_RECRUTEMENT.argent;

    if ((ville.ressources[ressourceUtilisee] ?? 0) < coutRequis) {
      return res.status(400).json({
        erreur: `Ressources insuffisantes : il faut ${coutRequis} ${ressourceUtilisee}`,
        possede: ville.ressources[ressourceUtilisee] ?? 0
      });
    }

    // Deduction cote serveur uniquement, tracee dans le ledger
    ville.ressources[ressourceUtilisee] -= coutRequis;
    await ville.save();

    await MouvementRessource.create({
      joueur: req.user._id,
      type: ressourceUtilisee,
      quantite: -coutRequis,
      origine: "quete",
      soldeApres: ville.ressources[ressourceUtilisee]
    });

    const herosTire = tirerHerosAleatoire(premium || niveauTaverne >= 5);

    // Si le joueur possede deja ce heros, il gagne une etoile plutot qu'un doublon
    const dejaPossede = await HerosJoueur.findOne({ joueur: req.user._id, codeHeros: herosTire.code });

    if (dejaPossede) {
      dejaPossede.etoiles = Math.min(dejaPossede.etoiles + 1, 5);
      await dejaPossede.save();
      return res.json({
        doublon: true,
        message: `${herosTire.nom} rejoint a nouveau ta cour : +1 etoile`,
        heros: {
          ...dejaPossede.toObject(),
          nom: herosTire.nom,
          rarete: herosTire.rarete,
          specialite: herosTire.specialite,
          stats: calculerStats(herosTire.code, dejaPossede.niveau)
        },
        ressources: ville.ressources
      });
    }

    const nouveauHeros = await HerosJoueur.create({
      joueur: req.user._id,
      codeHeros: herosTire.code,
      assigneA: ville._id
    });

    res.status(201).json({
      doublon: false,
      message: `${herosTire.nom} rejoint ton empire !`,
      heros: {
        ...nouveauHeros.toObject(),
        nom: herosTire.nom,
        rarete: herosTire.rarete,
        specialite: herosTire.specialite,
        histoire: herosTire.histoire,
        stats: calculerStats(herosTire.code, 1)
      },
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
