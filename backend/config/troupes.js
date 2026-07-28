// Les 12 unites de Jambar Empire, calquees sur le standard du genre.
// Chaque unite a : sante, population, attaque, defense, charge, entretien,
// vitesse, portee.
//
// CATEGORIES :
//   logistique      - ouvrier, transporteur (transport, peu de combat)
//   reconnaissance  - eclaireur (espionnage)
//   sol             - milicien, lanciers, infanterie
//   distance        - archers
//   monte           - cavalerie, cavalerie_lourde
//   siege           - baliste, belier, catapulte
//
// SYSTEME DE CONTRE :
//   Infanterie bat Archers | Archers bat Lanciers
//   Lanciers bat Montes    | Montes bat Infanterie
//   Siege : redoutable contre les murailles, tres faible contre les troupes

const TROUPES_CONFIG = {
  ouvrier: {
    nom: "Ouvrier",
    categorie: "logistique",
    description: "Porteur logistique. Indispensable pour fonder une nouvelle cite, mais sans valeur au combat.",
    batimentRequis: "caserne",
    coutUnitaire: { ble: 10, bois: 8, pierre: 0, fer: 0, argent: 5 },
    dureeUnitaireSecondes: 3,
    base: { attaque: 2, defense: 6, sante: 20, vitesse: 20, charge: 200, entretien: 1, population: 1, portee: 0 },
    fort: null,
    faible: "cavalerie"
  },
  milicien: {
    nom: "Milicien",
    categorie: "sol",
    description: "Citoyen arme a la hate. Bon marche et rapide a former, mais fragile face a une vraie armee.",
    batimentRequis: "caserne",
    coutUnitaire: { ble: 12, bois: 10, pierre: 0, fer: 5, argent: 6 },
    dureeUnitaireSecondes: 4,
    base: { attaque: 12, defense: 12, sante: 26, vitesse: 22, charge: 40, entretien: 1, population: 1, portee: 10 },
    fort: null,
    faible: "cavalerie"
  },
  eclaireur: {
    nom: "Eclaireur",
    categorie: "reconnaissance",
    description: "Espionne les cites ennemies et rapporte leurs ressources et defenses. Fuit le combat.",
    batimentRequis: "maison_eclaireurs",
    coutUnitaire: { ble: 18, bois: 12, pierre: 0, fer: 8, argent: 12 },
    dureeUnitaireSecondes: 5,
    base: { attaque: 8, defense: 10, sante: 24, vitesse: 90, charge: 15, entretien: 2, population: 1, portee: 20 },
    fort: null,
    faible: "archers"
  },
  lanciers: {
    nom: "Lanciers",
    categorie: "sol",
    description: "Mur de longues lances. Brisent les charges de cavalerie.",
    batimentRequis: "camp_lanciers",
    coutUnitaire: { ble: 22, bois: 22, pierre: 0, fer: 14, argent: 12 },
    dureeUnitaireSecondes: 7,
    base: { attaque: 26, defense: 28, sante: 36, vitesse: 24, charge: 30, entretien: 2, population: 1, portee: 20 },
    fort: "cavalerie",
    faible: "archers"
  },
  infanterie: {
    nom: "Infanterie",
    categorie: "sol",
    description: "Epeistes au bouclier. Meilleure unite de melee, redoutable contre les archers.",
    batimentRequis: "caserne",
    coutUnitaire: { ble: 20, bois: 12, pierre: 0, fer: 20, argent: 10 },
    dureeUnitaireSecondes: 6,
    base: { attaque: 30, defense: 34, sante: 44, vitesse: 20, charge: 25, entretien: 2, population: 1, portee: 15 },
    fort: "archers",
    faible: "cavalerie"
  },
  archers: {
    nom: "Archers",
    categorie: "distance",
    description: "Tireurs a distance. Meilleure attaque du royaume, mais tres fragiles au corps a corps.",
    batimentRequis: "terrain_archers",
    coutUnitaire: { ble: 18, bois: 28, pierre: 0, fer: 10, argent: 14 },
    dureeUnitaireSecondes: 8,
    base: { attaque: 40, defense: 14, sante: 26, vitesse: 22, charge: 20, entretien: 2, population: 1, portee: 180 },
    fort: "lanciers",
    faible: "infanterie"
  },
  cavalerie: {
    nom: "Cavalerie legere",
    categorie: "monte",
    description: "Cavaliers rapides et flexibles. Ideaux pour les raids et le pillage.",
    batimentRequis: "ecurie",
    coutUnitaire: { ble: 45, bois: 15, pierre: 0, fer: 28, argent: 25 },
    dureeUnitaireSecondes: 12,
    base: { attaque: 38, defense: 22, sante: 38, vitesse: 75, charge: 60, entretien: 4, population: 2, portee: 30 },
    fort: "infanterie",
    faible: "lanciers"
  },
  cavalerie_lourde: {
    nom: "Cavalerie lourde",
    categorie: "monte",
    description: "Cataphractaires en armure. Excellents en attaque comme en defense, mais devorent les vivres.",
    batimentRequis: "ecurie",
    coutUnitaire: { ble: 90, bois: 30, pierre: 0, fer: 70, argent: 60 },
    dureeUnitaireSecondes: 22,
    base: { attaque: 62, defense: 58, sante: 70, vitesse: 62, charge: 80, entretien: 10, population: 3, portee: 40 },
    fort: "infanterie",
    faible: "lanciers"
  },
  transporteur: {
    nom: "Transporteur",
    categorie: "logistique",
    description: "Chariot attele. Transporte d'enormes quantites de ressources, sans valeur au combat.",
    batimentRequis: "caravane_royale",
    coutUnitaire: { ble: 30, bois: 60, pierre: 0, fer: 20, argent: 20 },
    dureeUnitaireSecondes: 14,
    base: { attaque: 4, defense: 20, sante: 55, vitesse: 30, charge: 2000, entretien: 4, population: 2, portee: 0 },
    fort: null,
    faible: "cavalerie"
  },
  baliste: {
    nom: "Baliste",
    categorie: "siege",
    description: "Arbalete geante a tres longue portee. Efficace contre les autres engins de siege.",
    batimentRequis: "atelier_siege",
    coutUnitaire: { ble: 40, bois: 120, pierre: 40, fer: 90, argent: 60 },
    dureeUnitaireSecondes: 30,
    base: { attaque: 90, defense: 24, sante: 40, vitesse: 22, charge: 30, entretien: 12, population: 3, portee: 420 },
    fort: "siege",
    faible: "cavalerie"
  },
  belier: {
    nom: "Belier",
    categorie: "siege",
    description: "Lourd tronc ferre. Sert a enfoncer les portes et les fortifications ennemies.",
    batimentRequis: "atelier_beliers",
    coutUnitaire: { ble: 50, bois: 160, pierre: 60, fer: 70, argent: 55 },
    dureeUnitaireSecondes: 34,
    base: { attaque: 70, defense: 40, sante: 90, vitesse: 14, charge: 20, entretien: 14, population: 4, portee: 0 },
    fort: "muraille",
    faible: "archers"
  },
  catapulte: {
    nom: "Catapulte",
    categorie: "siege",
    description: "Projette d'enormes rochers a distance. L'arme reine pour raser les fortifications.",
    batimentRequis: "atelier_siege",
    coutUnitaire: { ble: 80, bois: 200, pierre: 150, fer: 130, argent: 110 },
    dureeUnitaireSecondes: 55,
    base: { attaque: 130, defense: 30, sante: 60, vitesse: 10, charge: 25, entretien: 22, population: 5, portee: 600 },
    fort: "muraille",
    faible: "cavalerie"
  }
};

const BONUS_CONTRE = 1.5;

// 8 paliers, debloques par le niveau de la caserne
const PALIERS = [
  { palier: 1, nom: "Recrue",      multiplicateur: 1.00, caserneRequise: 1 },
  { palier: 2, nom: "Soldat",      multiplicateur: 1.25, caserneRequise: 3 },
  { palier: 3, nom: "Veteran",     multiplicateur: 1.55, caserneRequise: 5 },
  { palier: 4, nom: "Aguerri",     multiplicateur: 1.90, caserneRequise: 7 },
  { palier: 5, nom: "Elite",       multiplicateur: 2.35, caserneRequise: 9 },
  { palier: 6, nom: "Garde Royal", multiplicateur: 2.85, caserneRequise: 11 },
  { palier: 7, nom: "Champion",    multiplicateur: 3.45, caserneRequise: 13 },
  { palier: 8, nom: "Jambar",      multiplicateur: 4.20, caserneRequise: 15 }
];

const MULTIPLICATEUR_COUT_PALIER = 1.35;

function palierMax(niveauCaserne) {
  let max = 1;
  for (const p of PALIERS) {
    if (niveauCaserne >= p.caserneRequise) max = p.palier;
  }
  return max;
}

function infosPalier(palier) {
  return PALIERS.find((p) => p.palier === palier) || PALIERS[0];
}

function calculerStatsTroupe(type, palier) {
  const config = TROUPES_CONFIG[type];
  if (!config) return null;
  const mult = infosPalier(palier).multiplicateur;
  const stats = {
    attaque: Math.round(config.base.attaque * mult),
    defense: Math.round(config.base.defense * mult),
    sante: Math.round(config.base.sante * mult),
    charge: Math.round(config.base.charge * mult),
    vitesse: config.base.vitesse,
    entretien: config.base.entretien,
    population: config.base.population,
    portee: config.base.portee
  };
  stats.puissance = Math.round(stats.attaque + stats.defense + stats.sante / 2);
  return stats;
}

function calculerCoutTotal(type, quantite, palier = 1) {
  const config = TROUPES_CONFIG[type];
  if (!config) return null;
  const multPalier = Math.pow(MULTIPLICATEUR_COUT_PALIER, palier - 1);
  const cout = {};
  for (const [ressource, valeur] of Object.entries(config.coutUnitaire)) {
    if (valeur > 0) cout[ressource] = Math.round(valeur * multPalier * quantite);
  }
  return cout;
}

function calculerDureeSecondes(type, quantite, niveauCaserne, palier = 1) {
  const config = TROUPES_CONFIG[type];
  if (!config) return null;
  const multPalier = 1 + (palier - 1) * 0.2;
  const reduction = Math.min(0.5, (niveauCaserne - 1) * 0.05);
  return Math.max(1, Math.round(config.dureeUnitaireSecondes * quantite * multPalier * (1 - reduction)));
}

function capaciteLot(niveauCaserne) {
  return 10 + (niveauCaserne - 1) * 10;
}

module.exports = {
  TROUPES_CONFIG,
  BONUS_CONTRE,
  PALIERS,
  palierMax,
  infosPalier,
  calculerStatsTroupe,
  calculerCoutTotal,
  calculerDureeSecondes,
  capaciteLot
};
