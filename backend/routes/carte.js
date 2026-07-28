const express = require("express");
const Region = require("../models/Region");
const Tile = require("../models/Tile");
const Ville = require("../models/Ville");
const CampCarte = require("../models/CampCarte");
const Marche = require("../models/Marche");
const { CAMPS_ENNEMIS } = require("../config/campsEnnemis");

const router = express.Router();

const LARGEUR_MONDE = 1200;
const HAUTEUR_MONDE = 800;
const PAS = 20;

// Les 15 regions, avec leur palais
router.get("/regions", async (req, res) => {
  const regions = await Region.find()
    .populate("proprietairePalais", "nom")
    .populate("allianceProprietaire", "nom tag")
    .lean();
  res.json(regions);
});

// Tout ce qu'il faut afficher sur la carte, pour une zone donnee
router.get("/monde", async (req, res) => {
  try {
    const xMin = Math.max(0, Number(req.query.xMin) || 0);
    const xMax = Math.min(LARGEUR_MONDE, Number(req.query.xMax) || LARGEUR_MONDE);
    const yMin = Math.max(0, Number(req.query.yMin) || 0);
    const yMax = Math.min(HAUTEUR_MONDE, Number(req.query.yMax) || HAUTEUR_MONDE);

    const zone = { x: { $gte: xMin, $lte: xMax }, y: { $gte: yMin, $lte: yMax } };

    const [tiles, villes, camps, regions, mesMarches] = await Promise.all([
      Tile.find(zone).select("x y typeTerrain ressource proprietaire ville").lean(),
      Ville.find({
        "coordonnees.x": { $gte: xMin, $lte: xMax },
        "coordonnees.y": { $gte: yMin, $lte: yMax }
      }).select("nom coordonnees proprietaire protectionJusquA").populate("proprietaire", "nom rang alliance").lean(),
      CampCarte.find({ ...zone, $or: [{ reapparitionLe: null }, { reapparitionLe: { $lte: new Date() } }] }).lean(),
      Region.find().select("nom estCapitale coordonnees proprietairePalais tauxImposition").lean(),
      Marche.find({ joueur: req.user._id, etat: { $ne: "terminee" } }).select("origine destination etat dateArrivee dateRetour").lean()
    ]);

    res.json({
      monde: { largeur: LARGEUR_MONDE, hauteur: HAUTEUR_MONDE, pas: PAS },
      tiles,
      villes: villes
        .filter((v) => v.coordonnees && Number.isFinite(v.coordonnees.x) && Number.isFinite(v.coordonnees.y))
        .map((v) => ({
          _id: v._id,
          nom: v.nom,
          x: v.coordonnees.x,
          y: v.coordonnees.y,
          joueur: v.proprietaire?.nom || "?",
          rang: v.proprietaire?.rang,
          estMoi: String(v.proprietaire?._id) === String(req.user._id),
          protegee: Boolean(v.protectionJusquA && new Date(v.protectionJusquA) > new Date())
        })),
      camps: camps.map((c) => {
        const fiche = CAMPS_ENNEMIS.find((f) => f.niveau === c.niveau);
        return { _id: c._id, x: c.x, y: c.y, niveau: c.niveau, nom: fiche?.nom || `Camp niveau ${c.niveau}` };
      }),
      regions: regions.filter((r) => r.coordonnees && Number.isFinite(r.coordonnees.x)),
      marches: mesMarches.filter((m) => m.origine && m.destination)
    });
  } catch (err) {
    console.error("[carte/monde] echec :", err);
    res.status(500).json({ erreur: err.message });
  }
});

// Detail d'une case precise
router.get("/case", async (req, res) => {
  const x = Number(req.query.x);
  const y = Number(req.query.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return res.status(400).json({ erreur: "Coordonnees invalides" });
  }

  const [tile, ville, camp] = await Promise.all([
    Tile.findOne({ x, y }).lean(),
    Ville.findOne({ "coordonnees.x": x, "coordonnees.y": y }).populate("proprietaire", "nom rang").lean(),
    CampCarte.findOne({ x, y }).lean()
  ]);

  if (!tile) return res.status(404).json({ erreur: "Case hors du continent" });

  let region = null;
  if (tile.countryCity) {
    const cc = await require("../models/CountryCity").findById(tile.countryCity)
      .populate("region", "nom estCapitale tauxImposition").lean();
    region = cc?.region ? { ...cc.region, departement: cc.nom } : null;
  }

  const ficheCamp = camp ? CAMPS_ENNEMIS.find((f) => f.niveau === camp.niveau) : null;

  res.json({
    tile,
    region,
    ville: ville ? {
      nom: ville.nom,
      joueur: ville.proprietaire?.nom,
      rang: ville.proprietaire?.rang,
      estMoi: String(ville.proprietaire?._id) === String(req.user._id)
    } : null,
    camp: camp ? { _id: camp._id, niveau: camp.niveau, ...ficheCamp } : null
  });
});

// Ancienne route, conservee pour compatibilite
router.get("/tiles", async (req, res) => {
  const { xMin = 0, xMax = 400, yMin = 0, yMax = 400 } = req.query;
  const tiles = await Tile.find({
    x: { $gte: Number(xMin), $lte: Number(xMax) },
    y: { $gte: Number(yMin), $lte: Number(yMax) }
  }).select("x y typeTerrain ressource proprietaire").limit(5000).lean();
  res.json(tiles);
});

module.exports = router;
