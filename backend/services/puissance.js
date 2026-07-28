// Calcul de la puissance d'un joueur, base des classements.

const { calculerStatsTroupe, palierMax } = require("../config/troupes");
const { calculerStats: statsHeros } = require("../config/heros");

const POIDS_BATIMENT = 25;

function puissanceBatiments(ville) {
  return (ville.batiments || []).reduce((total, b) => total + (b.niveau || 0) * POIDS_BATIMENT, 0);
}

function puissanceArmee(ville) {
  const palier = palierMax(
    ville.batiments?.find((b) => b.type === "caserne")?.niveau ?? 1
  );
  let total = 0;
  for (const [type, quantite] of Object.entries(ville.armee || {})) {
    if (!quantite || quantite <= 0) continue;
    const stats = calculerStatsTroupe(type, palier);
    if (stats) total += quantite * stats.puissance;
  }
  return Math.round(total);
}

function puissanceHeros(listeHeros) {
  return (listeHeros || []).reduce((total, h) => {
    const stats = statsHeros(h.codeHeros, h.niveau || 1);
    return total + (stats?.puissance || 0);
  }, 0);
}

function richesseVille(ville) {
  return Object.entries(ville.ressources || {})
    .filter(([cle]) => cle !== "_id")
    .reduce((total, [cle, quantite]) => {
      const poids = cle === "or" ? 20 : 1;
      return total + (quantite || 0) * poids;
    }, 0);
}

module.exports = { puissanceBatiments, puissanceArmee, puissanceHeros, richesseVille };
