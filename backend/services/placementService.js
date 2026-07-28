const Tile = require("../models/Tile");
const Joueur = require("../models/Joueur");

const RAYON_SECURITE = 10;
const RANGS_DANGEREUX = ["baron", "comte", "duc", "prince"];

async function trouverEmplacementAleatoire() {
  const tilesLibres = await Tile.find({ typeTerrain: "vide", proprietaire: null });

  if (tilesLibres.length === 0) {
    throw new Error("Aucun emplacement disponible sur la carte");
  }

  const candidats = [];
  for (const tile of tilesLibres) {
    const voisinsProches = await Tile.find({
      x: { $gte: tile.x - RAYON_SECURITE, $lte: tile.x + RAYON_SECURITE },
      y: { $gte: tile.y - RAYON_SECURITE, $lte: tile.y + RAYON_SECURITE },
      proprietaire: { $ne: null }
    }).populate("proprietaire", "rang");

    const dangereux = voisinsProches.some(
      (t) => t.proprietaire && RANGS_DANGEREUX.includes(t.proprietaire.rang)
    );

    if (!dangereux) candidats.push(tile);
  }

  const poolFinal = candidats.length > 0 ? candidats : tilesLibres;
  return poolFinal[Math.floor(Math.random() * poolFinal.length)];
}

module.exports = { trouverEmplacementAleatoire };
