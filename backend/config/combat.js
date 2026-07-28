// Moteur de resolution des batailles de Jambar Empire.
// TOUT est calcule cote serveur. Le client n'envoie que ses ordres
// (quelles troupes, quel heros, quelle cible) et recoit le rapport.

const { TROUPES_CONFIG, BONUS_CONTRE, calculerStatsTroupe } = require("./troupes");
const { trouverHeros, calculerStats: calculerStatsHeros } = require("./heros");

const NB_TOURS_MAX = 8;
// Freine les degats par tour pour que les batailles se jouent sur
// plusieurs echanges au lieu d'un seul choc.
const FACTEUR_DEGATS = 0.32;

// Multiplicateur de contre d'un type d'unite face a la composition adverse.
// Exemple : de l'infanterie face a une armee 100% archers = x1.5 plein.
// Face a une armee moitie archers, moitie cavalerie = bonus partiel.
function multiplicateurContre(typeAttaquant, armeeAdverse) {
  const config = TROUPES_CONFIG[typeAttaquant];
  if (!config) return 1;

  const totalAdverse = Object.values(armeeAdverse).reduce((a, b) => a + b, 0);
  if (totalAdverse === 0) return 1;

  let multiplicateur = 0;
  for (const [typeAdverse, quantite] of Object.entries(armeeAdverse)) {
    if (quantite <= 0) continue;
    const proportion = quantite / totalAdverse;

    if (config.fort === typeAdverse) {
      multiplicateur += proportion * BONUS_CONTRE;
    } else if (config.faible === typeAdverse) {
      multiplicateur += proportion * (1 / BONUS_CONTRE);
    } else {
      multiplicateur += proportion;
    }
  }
  return multiplicateur;
}

// Bonus apporte par un heros : leadership general + affinite avec le type
// d'unite dominant de l'armee menee.
function bonusHeros(herosJoueur, bonusEquipement = {}) {
  if (!herosJoueur) return { attaque: 1, defense: 1, nom: null };

  const fiche = trouverHeros(herosJoueur.codeHeros);
  if (!fiche) return { attaque: 1, defense: 1, nom: null };

  const statsBase = calculerStatsHeros(herosJoueur.codeHeros, herosJoueur.niveau || 1);
  // L'equipement s'ajoute directement aux statistiques du heros
  const stats = {
    attaque: statsBase.attaque + (bonusEquipement.attaque || 0),
    defense: statsBase.defense + (bonusEquipement.defense || 0),
    sante: statsBase.sante + (bonusEquipement.sante || 0),
    leadership: statsBase.leadership + (bonusEquipement.leadership || 0),
    vitesse: statsBase.vitesse + (bonusEquipement.vitesse || 0)
  };
  const bonusLeadership = stats.leadership / 400; // ~0.10 a 0.35
  const bonusEtoiles = ((herosJoueur.etoiles || 1) - 1) * 0.05;

  return {
    attaque: 1 + stats.attaque / 500 + bonusLeadership + bonusEtoiles,
    defense: 1 + stats.defense / 500 + bonusLeadership + bonusEtoiles,
    nom: fiche.nom,
    typeFavori: fiche.typeFavori
  };
}

// Puissance offensive et reserve de points de vie d'une armee.
function evaluerArmee(armee, palier, armeeAdverse, bonus, bonusTech = {}) {
  let degats = 0;
  let pointsDeVie = 0;
  let capaciteCharge = 0;

  for (const [type, quantite] of Object.entries(armee)) {
    if (!quantite || quantite <= 0) continue;
    const stats = calculerStatsTroupe(type, palier);
    if (!stats) continue;

    let multiplicateur = multiplicateurContre(type, armeeAdverse);

    // Affinite du heros avec ce type d'unite
    if (bonus?.typeFavori === type) multiplicateur *= 1.15;

    const multAttaqueTech = 1 + (bonusTech.attaque || 0) / 100;
    const multDefenseTech = 1 + (bonusTech.defense || 0) / 100;
    const multSanteTech = 1 + (bonusTech.sante || 0) / 100;
    const multChargeTech = 1 + (bonusTech.charge || 0) / 100;
    const multSiege = TROUPES_CONFIG[type]?.categorie === "siege"
      ? 1 + (bonusTech.attaque_siege || 0) / 100
      : 1;

    degats += quantite * stats.attaque * multiplicateur * (bonus?.attaque || 1) * multAttaqueTech * multSiege;
    pointsDeVie += quantite * (stats.sante * multSanteTech + stats.defense * (bonus?.defense || 1) * multDefenseTech);
    capaciteCharge += quantite * stats.charge * multChargeTech;
  }

  return { degats, pointsDeVie, capaciteCharge };
}

// Applique un pourcentage de pertes a une armee, proportionnellement.
function appliquerPertes(armee, proportionPerdue) {
  const survivants = {};
  const pertes = {};

  for (const [type, quantite] of Object.entries(armee)) {
    if (!quantite || quantite <= 0) continue;
    const perdus = Math.min(quantite, Math.round(quantite * proportionPerdue));
    pertes[type] = perdus;
    survivants[type] = quantite - perdus;
  }

  return { survivants, pertes };
}

/**
 * Resout une bataille complete.
 * @param {Object} armeeAttaquant - { type: quantite }
 * @param {Object} armeeDefenseur - { type: quantite }
 * @param {Object} herosAttaquant - document HerosJoueur ou null
 * @param {Number} palierAttaquant - palier des troupes de l'attaquant
 * @param {Number} palierDefenseur - palier des troupes du defenseur
 * @param {Number} bonusMuraille - multiplicateur de defense (1 = pas de muraille)
 */
function resoudreBataille({
  armeeAttaquant,
  armeeDefenseur,
  herosAttaquant = null,
  palierAttaquant = 1,
  palierDefenseur = 1,
  bonusMuraille = 1,
  bonusTechAttaquant = {},
  equipementHeros = {}
}) {
  const bonusA = bonusHeros(herosAttaquant, equipementHeros);
  // Les recherches Commandement et Strategie amplifient l'effet du heros
  if (bonusA.nom) {
    bonusA.attaque *= 1 + (bonusTechAttaquant.heros_attaque || 0) / 100;
    bonusA.defense *= 1 + (bonusTechAttaquant.heros_defense || 0) / 100;
  }
  const bonusD = { attaque: 1, defense: bonusMuraille };

  let armeeA = { ...armeeAttaquant };
  let armeeD = { ...armeeDefenseur };

  const journal = [];
  let tour = 0;

  while (tour < NB_TOURS_MAX) {
    tour++;

    const evalA = evaluerArmee(armeeA, palierAttaquant, armeeD, bonusA, bonusTechAttaquant);
    const evalD = evaluerArmee(armeeD, palierDefenseur, armeeA, bonusD);

    if (evalA.pointsDeVie <= 0 || evalD.pointsDeVie <= 0) break;

    // Chaque camp inflige ses degats simultanement, avec un leger aleatoire
    const aleaA = 0.9 + Math.random() * 0.2;
    const aleaD = 0.9 + Math.random() * 0.2;

    const proportionPerdueD = Math.min(1, (evalA.degats * aleaA * FACTEUR_DEGATS) / evalD.pointsDeVie);
    const proportionPerdueA = Math.min(1, (evalD.degats * aleaD * FACTEUR_DEGATS) / evalA.pointsDeVie);

    const resultatD = appliquerPertes(armeeD, proportionPerdueD);
    const resultatA = appliquerPertes(armeeA, proportionPerdueA);

    armeeD = resultatD.survivants;
    armeeA = resultatA.survivants;

    journal.push({
      tour,
      pertesAttaquant: resultatA.pertes,
      pertesDefenseur: resultatD.pertes
    });

    const restantA = Object.values(armeeA).reduce((a, b) => a + b, 0);
    const restantD = Object.values(armeeD).reduce((a, b) => a + b, 0);
    if (restantA === 0 || restantD === 0) break;
  }

  const restantA = Object.values(armeeA).reduce((a, b) => a + b, 0);
  const restantD = Object.values(armeeD).reduce((a, b) => a + b, 0);

  let victoire;
  if (restantA > 0 && restantD === 0) victoire = true;
  else if (restantA === 0) victoire = false;
  else {
    // Les deux camps tiennent encore : celui qui a garde la plus grande
    // proportion de son armee l'emporte.
    const totalDepartA = Object.values(armeeAttaquant).reduce((a, b) => a + b, 0);
    const totalDepartD = Object.values(armeeDefenseur).reduce((a, b) => a + b, 0);
    victoire = restantA / (totalDepartA || 1) > restantD / (totalDepartD || 1);
  }

  // Pertes cumulees
  const pertesAttaquant = {};
  const pertesDefenseur = {};
  for (const [type, quantiteDepart] of Object.entries(armeeAttaquant)) {
    const perte = quantiteDepart - (armeeA[type] || 0);
    if (perte > 0) pertesAttaquant[type] = perte;
  }
  for (const [type, quantiteDepart] of Object.entries(armeeDefenseur)) {
    const perte = quantiteDepart - (armeeD[type] || 0);
    if (perte > 0) pertesDefenseur[type] = perte;
  }

  const capaciteSurvivants = evaluerArmee(armeeA, palierAttaquant, {}, null, bonusTechAttaquant).capaciteCharge;

  return {
    victoire,
    tours: tour,
    journal,
    survivantsAttaquant: armeeA,
    survivantsDefenseur: armeeD,
    pertesAttaquant,
    pertesDefenseur,
    capaciteCharge: Math.round(capaciteSurvivants),
    herosUtilise: bonusA.nom
  };
}

module.exports = { resoudreBataille, multiplicateurContre, bonusHeros };
