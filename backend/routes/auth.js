const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const Tile = require("../models/Tile");
const { trouverEmplacementAleatoire } = require("../services/placementService");
const { BATIMENTS_DE_DEPART } = require("../config/batiments");

const router = express.Router();

const limiteurConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  message: { erreur: "Trop de tentatives, reessayez plus tard" }
});

router.post("/inscription", limiteurConnexion, async (req, res) => {
  try {
    const { nom, email, motDePasse } = req.body;
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ erreur: "Champs manquants" });
    }

    const tile = await trouverEmplacementAleatoire();

    const joueur = await Joueur.create({ nom, email, motDePasse });

    const ville = await Ville.create({
      nom: `Cite de ${nom}`,
      proprietaire: joueur._id,
      countryCity: tile.countryCity,
      coordonnees: { x: tile.x, y: tile.y },
      protectionDebutantJusquA: new Date(Date.now() + 48 * 60 * 60 * 1000),
      batiments: BATIMENTS_DE_DEPART.map((b) => ({ ...b, finAmelioration: null }))
    });

    joueur.villes.push(ville._id);
    await joueur.save();

    tile.proprietaire = joueur._id;
    tile.ville = ville._id;
    await tile.save();

    const token = jwt.sign({ id: joueur._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

    res.status(201).json({ token, joueur: { id: joueur._id, nom: joueur.nom }, ville });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

router.post("/connexion", limiteurConnexion, async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    const joueur = await Joueur.findOne({ email });
    if (!joueur || !(await joueur.verifierMotDePasse(motDePasse))) {
      return res.status(401).json({ erreur: "Identifiants incorrects" });
    }
    if (joueur.banni) {
      return res.status(403).json({ erreur: "Compte banni" });
    }

    joueur.derniereConnexion = new Date();
    await joueur.save();

    const token = jwt.sign({ id: joueur._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

    res.json({ token, joueur: { id: joueur._id, nom: joueur.nom, role: joueur.role } });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
