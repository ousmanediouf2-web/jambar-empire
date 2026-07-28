// Camps ennemis controles par l'IA, repartis sur le continent de Jambar.
// Chaque niveau a une armee, un palier de troupes et un butin.

const CAMPS_ENNEMIS = [
  {
    niveau: 1,
    nom: "Bande de pillards",
    description: "Quelques brigands mal armes qui rodent autour des villages.",
    palier: 1,
    armee: { milicien: 12, archers: 4 },
    butin: { ble: 180, bois: 150, pierre: 80, fer: 40, argent: 120 },
    experience: 20
  },
  {
    niveau: 2,
    nom: "Campement de brigands",
    description: "Un camp fortifie de fortune, garde jour et nuit.",
    palier: 1,
    armee: { milicien: 25, lanciers: 10, archers: 10 },
    butin: { ble: 350, bois: 300, pierre: 160, fer: 90, argent: 260 },
    experience: 45
  },
  {
    niveau: 3,
    nom: "Poste de mercenaires",
    description: "Des soldats sans maitre, aguerris et bien equipes.",
    palier: 2,
    armee: { infanterie: 20, lanciers: 20, archers: 18, cavalerie: 6 },
    butin: { ble: 700, bois: 600, pierre: 340, fer: 200, argent: 520 },
    experience: 90
  },
  {
    niveau: 4,
    nom: "Fort des Terres Rouges",
    description: "Un fort tenu par une compagnie disciplinee, appuyee par des cavaliers.",
    palier: 2,
    armee: { infanterie: 45, lanciers: 40, archers: 35, cavalerie: 18 },
    butin: { ble: 1400, bois: 1200, pierre: 700, fer: 420, argent: 1100 },
    experience: 180
  },
  {
    niveau: 5,
    nom: "Citadelle du Desert d'Or",
    description: "Une citadelle protegee par des murailles et des engins de siege.",
    palier: 3,
    armee: { infanterie: 90, lanciers: 80, archers: 75, cavalerie: 40, baliste: 6 },
    butin: { ble: 2800, bois: 2400, pierre: 1500, fer: 900, argent: 2300 },
    experience: 360,
    bonusMuraille: 1.3
  },
  {
    niveau: 6,
    nom: "Horde des Montagnes de l'Est",
    description: "Une horde nombreuse menee par des cavaliers lourds.",
    palier: 3,
    armee: { infanterie: 160, lanciers: 140, archers: 130, cavalerie: 70, cavalerie_lourde: 25 },
    butin: { ble: 5200, bois: 4500, pierre: 2800, fer: 1800, argent: 4400 },
    experience: 700,
    bonusMuraille: 1.2
  },
  {
    niveau: 7,
    nom: "Armee du Seigneur Noir",
    description: "Une armee complete, disciplinee, avec catapultes et garde d'elite.",
    palier: 4,
    armee: { infanterie: 300, lanciers: 260, archers: 250, cavalerie: 140, cavalerie_lourde: 60, catapulte: 10 },
    butin: { ble: 10000, bois: 8500, pierre: 5500, fer: 3600, argent: 8800 },
    experience: 1400,
    bonusMuraille: 1.5
  }
];

function trouverCamp(niveau) {
  return CAMPS_ENNEMIS.find((c) => c.niveau === Number(niveau)) || null;
}

module.exports = { CAMPS_ENNEMIS, trouverCamp };
