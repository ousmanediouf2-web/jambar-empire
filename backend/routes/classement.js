const express = require("express");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const HerosJoueur = require("../models/HerosJoueur");
const Alliance = require("../models/Alliance");
const {
  puissanceBatiments,
  puissanceArmee,
  puissanceHeros,
  richesseVille
} = require("../services/puissance");

const router = express.Router();

const LIMITE = 50;

// Construit le tableau de tous les joueurs avec leurs scores
async function calculerScores() {
  const joueurs = await Joueur.find({ banni: false })
    .select("nom rang pointsPrestige alliance")
    .populate("alliance", "nom tag")
    .lean();

  const villes = await Ville.find().lean();
  const heros = await HerosJoueur.find().lean();

  const villesParJoueur = {};
  for (const v of villes) {
    const cle = String(v.proprietaire);
    if (!villesParJoueur[cle]) villesParJoueur[cle] = [];
    villesParJoueur[cle].push(v);
  }

  const herosParJoueur = {};
  for (const h of heros) {
    const cle = String(h.joueur);
    if (!herosParJoueur[cle]) herosParJoueur[cle] = [];
    herosParJoueur[cle].push(h);
  }

  return joueurs.map((j) => {
    const mesVilles = villesParJoueur[String(j._id)] || [];
    const mesHeros = herosParJoueur[String(j._id)] || [];

    const scoreBatiments = mesVilles.reduce((t, v) => t + puissanceBatiments(v), 0);
    const scoreArmee = mesVilles.reduce((t, v) => t + puissanceArmee(v), 0);
    const scoreHeros = puissanceHeros(mesHeros);
    const scoreRichesse = mesVilles.reduce((t, v) => t + richesseVille(v), 0);

    return {
      _id: j._id,
      nom: j.nom,
      rang: j.rang,
      alliance: j.alliance ? { nom: j.alliance.nom, tag: j.alliance.tag } : null,
      prestige: j.pointsPrestige || 0,
      nbVilles: mesVilles.length,
      nbHeros: mesHeros.length,
      scoreArmee,
      scoreHeros,
      scoreBatiments,
      scoreRichesse,
      puissance: scoreBatiments + scoreArmee + scoreHeros + (j.pointsPrestige || 0)
    };
  });
}

// Classements des joueurs, par categorie
router.get("/", async (req, res) => {
  try {
    const scores = await calculerScores();

    function trier(cle) {
      return [...scores]
        .sort((a, b) => b[cle] - a[cle])
        .slice(0, LIMITE)
        .map((j, i) => ({ position: i + 1, ...j }));
    }

    const monId = String(req.user._id);
    const maPosition = {};
    for (const cle of ["puissance", "scoreArmee", "scoreHeros", "prestige", "scoreRichesse"]) {
      const trie = [...scores].sort((a, b) => b[cle] - a[cle]);
      maPosition[cle] = trie.findIndex((j) => String(j._id) === monId) + 1;
    }

    res.json({
      puissance: trier("puissance"),
      armee: trier("scoreArmee"),
      heros: trier("scoreHeros"),
      conquete: trier("prestige"),
      richesse: trier("scoreRichesse"),
      maPosition,
      totalJoueurs: scores.length
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Classement des alliances
router.get("/alliances", async (req, res) => {
  try {
    const scores = await calculerScores();
    const alliances = await Alliance.find().select("nom tag membres coffre").lean();

    const scoreParJoueur = {};
    for (const s of scores) scoreParJoueur[String(s._id)] = s;

    const classement = alliances.map((a) => {
      let puissance = 0;
      for (const m of a.membres) {
        const s = scoreParJoueur[String(m.joueur)];
        if (s) puissance += s.puissance;
      }
      const tresor = Object.entries(a.coffre || {})
        .filter(([cle]) => cle !== "_id")
        .reduce((t, [, q]) => t + (q || 0), 0);

      return {
        _id: a._id,
        nom: a.nom,
        tag: a.tag,
        nbMembres: a.membres.length,
        puissance,
        tresor
      };
    });

    classement.sort((a, b) => b.puissance - a.puissance);
    res.json(classement.slice(0, LIMITE).map((a, i) => ({ position: i + 1, ...a })));
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
