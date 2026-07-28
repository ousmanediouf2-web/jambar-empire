// Arbre de recherche technologique de Jambar Empire.
// Chaque technologie a plusieurs niveaux : 22 technologies x 10 niveaux
// = 220 paliers de recherche au total.
//
// Les effets s'appliquent REELLEMENT au jeu (production, combat, construction).

const CATEGORIES = {
  economie: { nom: "Economie", couleur: "#5DCAA5" },
  militaire: { nom: "Militaire", couleur: "#E8837A" },
  heros: { nom: "Heros", couleur: "#A96BE0" },
  construction: { nom: "Construction", couleur: "#E3B23C" },
  agriculture: { nom: "Agriculture", couleur: "#9FE1CB" }
};

// effet.type :
//   production_<ressource> : +% de production de cette ressource
//   attaque / defense / sante : +% aux stats de toutes les troupes
//   vitesse_marche : +% de vitesse des armees
//   charge : +% de capacite de transport
//   vitesse_construction : -% de duree des ameliorations
//   cout_construction : -% du cout des ameliorations
//   vitesse_entrainement : -% de duree de formation des troupes
//   heros_attaque / heros_defense : +% aux bonus apportes par les heros
//   capacite_stockage : +% de capacite de l'entrepot
//   butin : +% de butin rapporte des raids

const TECHNOLOGIES = [
  // --- ECONOMIE ---
  { code: "commerce", nom: "Commerce", categorie: "economie", niveauMax: 10,
    description: "Ameliore les revenus en argent de ton empire.",
    academieRequise: 1, effet: { type: "production_argent", parNiveau: 5 },
    coutBase: { argent: 200, bois: 150, pierre: 100 }, dureeBase: 90 },
  { code: "monnaie_royale", nom: "Monnaie Royale", categorie: "economie", niveauMax: 10,
    description: "Frappe de meilleures pieces, augmentant encore les revenus.",
    academieRequise: 4, prerequis: { commerce: 3 }, effet: { type: "production_argent", parNiveau: 8 },
    coutBase: { argent: 600, pierre: 400, fer: 200 }, dureeBase: 240 },
  { code: "entreposage", nom: "Entreposage", categorie: "economie", niveauMax: 10,
    description: "Augmente la capacite de stockage de tes entrepots.",
    academieRequise: 2, effet: { type: "capacite_stockage", parNiveau: 10 },
    coutBase: { argent: 250, bois: 300, pierre: 200 }, dureeBase: 120 },
  { code: "caravanes", nom: "Caravanes", categorie: "economie", niveauMax: 10,
    description: "Tes unites transportent davantage de ressources.",
    academieRequise: 3, effet: { type: "charge", parNiveau: 8 },
    coutBase: { argent: 300, bois: 350, ble: 200 }, dureeBase: 150 },
  { code: "pillage", nom: "Art du Pillage", categorie: "economie", niveauMax: 10,
    description: "Augmente le butin rapporte des camps ennemis.",
    academieRequise: 5, prerequis: { caravanes: 2 }, effet: { type: "butin", parNiveau: 6 },
    coutBase: { argent: 500, fer: 300, ble: 300 }, dureeBase: 200 },

  // --- AGRICULTURE ---
  { code: "labour", nom: "Labour", categorie: "agriculture", niveauMax: 10,
    description: "Ameliore le rendement de tes fermes.",
    academieRequise: 1, effet: { type: "production_ble", parNiveau: 6 },
    coutBase: { argent: 150, bois: 200, pierre: 80 }, dureeBase: 80 },
  { code: "irrigation", nom: "Irrigation", categorie: "agriculture", niveauMax: 10,
    description: "Detourne les fleuves pour nourrir les cultures.",
    academieRequise: 4, prerequis: { labour: 3 }, effet: { type: "production_ble", parNiveau: 9 },
    coutBase: { argent: 500, bois: 400, pierre: 350 }, dureeBase: 220 },
  { code: "sylviculture", nom: "Sylviculture", categorie: "agriculture", niveauMax: 10,
    description: "Exploite les forets de facon plus efficace.",
    academieRequise: 1, effet: { type: "production_bois", parNiveau: 6 },
    coutBase: { argent: 150, bois: 120, pierre: 120 }, dureeBase: 80 },
  { code: "taille_pierre", nom: "Taille de la Pierre", categorie: "agriculture", niveauMax: 10,
    description: "Ameliore le rendement de tes carrieres.",
    academieRequise: 2, effet: { type: "production_pierre", parNiveau: 6 },
    coutBase: { argent: 200, bois: 200, pierre: 100 }, dureeBase: 100 },
  { code: "metallurgie", nom: "Metallurgie", categorie: "agriculture", niveauMax: 10,
    description: "Extrait et raffine le fer plus efficacement.",
    academieRequise: 3, effet: { type: "production_fer", parNiveau: 7 },
    coutBase: { argent: 350, bois: 250, fer: 150 }, dureeBase: 160 },

  // --- MILITAIRE ---
  { code: "armement", nom: "Armement", categorie: "militaire", niveauMax: 10,
    description: "Ameliore l'attaque de toutes tes troupes.",
    academieRequise: 2, effet: { type: "attaque", parNiveau: 4 },
    coutBase: { argent: 300, fer: 250, bois: 150 }, dureeBase: 140 },
  { code: "armures", nom: "Armures", categorie: "militaire", niveauMax: 10,
    description: "Ameliore la defense de toutes tes troupes.",
    academieRequise: 2, effet: { type: "defense", parNiveau: 4 },
    coutBase: { argent: 300, fer: 300, pierre: 150 }, dureeBase: 140 },
  { code: "endurance", nom: "Endurance", categorie: "militaire", niveauMax: 10,
    description: "Tes soldats encaissent davantage de coups.",
    academieRequise: 3, effet: { type: "sante", parNiveau: 5 },
    coutBase: { argent: 350, ble: 400, fer: 150 }, dureeBase: 160 },
  { code: "cartographie", nom: "Cartographie", categorie: "militaire", niveauMax: 10,
    description: "Tes armees se deplacent plus vite sur le continent.",
    academieRequise: 3, effet: { type: "vitesse_marche", parNiveau: 6 },
    coutBase: { argent: 300, bois: 300, ble: 200 }, dureeBase: 150 },
  { code: "discipline", nom: "Discipline", categorie: "militaire", niveauMax: 10,
    description: "Reduit le temps de formation des troupes.",
    academieRequise: 4, prerequis: { armement: 2 }, effet: { type: "vitesse_entrainement", parNiveau: 4 },
    coutBase: { argent: 450, ble: 350, fer: 250 }, dureeBase: 200 },
  { code: "siege", nom: "Poliorcetique", categorie: "militaire", niveauMax: 10,
    description: "Renforce l'attaque de tes engins de siege.",
    academieRequise: 6, prerequis: { armement: 4 }, effet: { type: "attaque_siege", parNiveau: 8 },
    coutBase: { argent: 800, bois: 700, fer: 500 }, dureeBase: 320 },
  { code: "fortifications", nom: "Fortifications", categorie: "militaire", niveauMax: 10,
    description: "Renforce la defense de ta cite face aux assauts.",
    academieRequise: 5, prerequis: { armures: 3 }, effet: { type: "defense_cite", parNiveau: 7 },
    coutBase: { argent: 600, pierre: 800, fer: 300 }, dureeBase: 280 },

  // --- HEROS ---
  { code: "commandement", nom: "Commandement", categorie: "heros", niveauMax: 10,
    description: "Tes heros mènent tes armees avec plus d'autorite.",
    academieRequise: 3, effet: { type: "heros_attaque", parNiveau: 5 },
    coutBase: { argent: 400, ble: 300, fer: 200 }, dureeBase: 180 },
  { code: "strategie", nom: "Strategie", categorie: "heros", niveauMax: 10,
    description: "Tes heros protegent mieux leurs troupes.",
    academieRequise: 3, effet: { type: "heros_defense", parNiveau: 5 },
    coutBase: { argent: 400, pierre: 300, fer: 200 }, dureeBase: 180 },
  { code: "renommee", nom: "Renommee", categorie: "heros", niveauMax: 10,
    description: "Tes heros gagnent de l'experience plus rapidement.",
    academieRequise: 5, prerequis: { commandement: 3 }, effet: { type: "experience_heros", parNiveau: 10 },
    coutBase: { argent: 700, ble: 500, or: 5 }, dureeBase: 300 },

  // --- CONSTRUCTION ---
  { code: "maconnerie", nom: "Maconnerie", categorie: "construction", niveauMax: 10,
    description: "Reduit la duree des ameliorations de batiments.",
    academieRequise: 2, effet: { type: "vitesse_construction", parNiveau: 5 },
    coutBase: { argent: 250, bois: 250, pierre: 250 }, dureeBase: 130 },
  { code: "architecture", nom: "Architecture", categorie: "construction", niveauMax: 10,
    description: "Reduit le cout en ressources des ameliorations.",
    academieRequise: 5, prerequis: { maconnerie: 3 }, effet: { type: "cout_construction", parNiveau: 3 },
    coutBase: { argent: 700, bois: 600, pierre: 600 }, dureeBase: 300 }
];

const MULTIPLICATEUR_COUT = 1.6;
const MULTIPLICATEUR_DUREE = 1.45;

function trouverTechnologie(code) {
  return TECHNOLOGIES.find((t) => t.code === code) || null;
}

function calculerCout(code, niveauActuel) {
  const tech = trouverTechnologie(code);
  if (!tech) return null;
  const cout = {};
  for (const [ressource, valeur] of Object.entries(tech.coutBase)) {
    cout[ressource] = Math.round(valeur * Math.pow(MULTIPLICATEUR_COUT, niveauActuel));
  }
  return cout;
}

function calculerDureeSecondes(code, niveauActuel) {
  const tech = trouverTechnologie(code);
  if (!tech) return null;
  return Math.round(tech.dureeBase * Math.pow(MULTIPLICATEUR_DUREE, niveauActuel));
}

// Cumule tous les bonus des recherches d'un joueur.
// Retourne { type: pourcentageTotal }
function bonusRecherches(recherches = []) {
  const bonus = {};
  for (const r of recherches) {
    if (!r.niveau || r.niveau <= 0) continue;
    const tech = trouverTechnologie(r.code);
    if (!tech) continue;
    const total = tech.effet.parNiveau * r.niveau;
    bonus[tech.effet.type] = (bonus[tech.effet.type] || 0) + total;
  }
  return bonus;
}

// Convertit un pourcentage de bonus en multiplicateur (ex: 25 -> 1.25)
function multiplicateur(bonus, type) {
  return 1 + (bonus[type] || 0) / 100;
}

// Pour les reductions (duree, cout) : plafonnees a -60%
function reduction(bonus, type) {
  const pourcentage = Math.min(60, bonus[type] || 0);
  return 1 - pourcentage / 100;
}

module.exports = {
  CATEGORIES,
  TECHNOLOGIES,
  trouverTechnologie,
  calculerCout,
  calculerDureeSecondes,
  bonusRecherches,
  multiplicateur,
  reduction
};
