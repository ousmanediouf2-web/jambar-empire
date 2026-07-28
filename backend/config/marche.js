// Calculs de deplacement d'armee sur la carte du continent de Jambar.

const { TROUPES_CONFIG, calculerStatsTroupe } = require("./troupes");

// Une armee avance a la vitesse de son unite la plus lente.
// Facteur qui convertit distance/vitesse en secondes de trajet.
const FACTEUR_TRAJET = 22;

// Unites de ressource recoltees par seconde sur une case.
const TAUX_COLLECTE = 2;

// Nombre maximum d'armees en deplacement simultane
const MARCHES_MAX = 3;

function distanceEntre(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Vitesse de l'armee = vitesse de l'unite la plus lente envoyee
function vitesseArmee(armee) {
  let vitesseMin = Infinity;
  for (const [type, quantite] of Object.entries(armee)) {
    if (!quantite || quantite <= 0) continue;
    const config = TROUPES_CONFIG[type];
    if (!config) continue;
    vitesseMin = Math.min(vitesseMin, config.base.vitesse);
  }
  return vitesseMin === Infinity ? 20 : vitesseMin;
}

function capaciteChargeArmee(armee, palier) {
  let total = 0;
  for (const [type, quantite] of Object.entries(armee)) {
    if (!quantite || quantite <= 0) continue;
    const stats = calculerStatsTroupe(type, palier);
    if (stats) total += quantite * stats.charge;
  }
  return Math.round(total);
}

function dureeTrajetSecondes(origine, destination, armee) {
  const distance = distanceEntre(origine, destination);
  const vitesse = vitesseArmee(armee);
  return Math.max(5, Math.round((distance / vitesse) * FACTEUR_TRAJET));
}

function dureeCollecteSecondes(capaciteCharge) {
  return Math.max(5, Math.round(capaciteCharge / TAUX_COLLECTE));
}

module.exports = {
  FACTEUR_TRAJET,
  TAUX_COLLECTE,
  MARCHES_MAX,
  distanceEntre,
  vitesseArmee,
  capaciteChargeArmee,
  dureeTrajetSecondes,
  dureeCollecteSecondes
};
