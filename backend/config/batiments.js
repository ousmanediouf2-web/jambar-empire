// Systeme complet des batiments de Jambar Empire.
//
// Chaque batiment porte : identifiant, nom, categorie, zone, role,
// niveau de Palais requis, prerequis eventuels, cout de base, duree de base,
// niveau maximum, et ses effets de jeu.
//
// Les effets sont declaratifs : pour ajouter un batiment il suffit d'ajouter
// une entree ici, sans toucher au reste du code.

const NB_EMPLACEMENTS_INTERIEUR = 33;
const NB_EMPLACEMENTS_EXTERIEUR = 10;

const CATEGORIES = {
  administration: "Administration",
  economie: "Economie",
  militaire: "Militaire",
  defense: "Defense",
  heros: "Heros",
  diplomatie: "Diplomatie",
  prestige: "Prestige"
};

const BATIMENTS_CONFIG = {
  // ================= ADMINISTRATION =================
  palais_royal: {
    nom: "Palais Royal", categorie: "administration", zone: "interieur",
    unique: true, fixe: true, emplacementFixe: 0, niveauMax: 20, palaisRequis: 0,
    role: "Coeur de l'empire. Determine le niveau maximum de tous les autres batiments et debloque les fonctionnalites.",
    coutBase: { argent: 300, bois: 200, pierre: 200, fer: 100 }, dureeBaseSecondes: 120
  },
  conseil_royal: {
    nom: "Conseil Royal", categorie: "administration", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 3,
    role: "Les conseillers du royaume. Ameliore le moral du peuple, ce qui accroit toute la production.",
    coutBase: { argent: 400, bois: 300, pierre: 250, fer: 80 }, dureeBaseSecondes: 160,
    moralParNiveau: 2
  },
  habitation: {
    nom: "Maisons du Royaume", categorie: "administration", zone: "interieur",
    niveauMax: 15, palaisRequis: 1,
    role: "Loge tes sujets. Chaque niveau augmente la population disponible pour former des troupes.",
    coutBase: { argent: 60, bois: 100, pierre: 60, fer: 10 }, dureeBaseSecondes: 40,
    populationParNiveau: 120
  },
  place_royale: {
    nom: "Place Royale", categorie: "administration", zone: "interieur",
    unique: true, niveauMax: 12, palaisRequis: 4,
    role: "Centre social de la capitale. Accueille les fetes et evenements, et augmente le moral.",
    coutBase: { argent: 250, bois: 180, pierre: 280, fer: 50 }, dureeBaseSecondes: 130,
    moralParNiveau: 1
  },

  // ================= ECONOMIE =================
  ferme: {
    nom: "Ferme Royale", categorie: "economie", zone: "exterieur",
    niveauMax: 20, palaisRequis: 1,
    role: "Produit la nourriture qui entretient ta population et tes armees.",
    coutBase: { argent: 80, bois: 100, pierre: 40, fer: 10 }, dureeBaseSecondes: 45,
    production: { ressource: "ble", parHeure: 120 }
  },
  scierie: {
    nom: "Camp Forestier", categorie: "economie", zone: "exterieur",
    niveauMax: 20, palaisRequis: 1,
    role: "Exploite les forets et produit le bois necessaire aux constructions.",
    coutBase: { argent: 80, bois: 60, pierre: 80, fer: 20 }, dureeBaseSecondes: 45,
    production: { ressource: "bois", parHeure: 100 }
  },
  carriere: {
    nom: "Carriere Royale", categorie: "economie", zone: "exterieur",
    niveauMax: 20, palaisRequis: 1,
    role: "Extrait la pierre des murailles, tours et monuments.",
    coutBase: { argent: 90, bois: 120, pierre: 40, fer: 25 }, dureeBaseSecondes: 50,
    production: { ressource: "pierre", parHeure: 80 }
  },
  mine: {
    nom: "Mine de Fer", categorie: "economie", zone: "exterieur",
    niveauMax: 20, palaisRequis: 1,
    role: "Extrait le fer indispensable aux armes, armures et engins de guerre.",
    coutBase: { argent: 110, bois: 140, pierre: 100, fer: 20 }, dureeBaseSecondes: 60,
    production: { ressource: "fer", parHeure: 60 }
  },
  hotel_monnaies: {
    nom: "Mine d'Or", categorie: "economie", zone: "exterieur",
    niveauMax: 18, palaisRequis: 2,
    role: "Extrait l'or du royaume. Ressource rare, exigee par les recherches et recrutements avances.",
    coutBase: { argent: 60, bois: 90, pierre: 120, fer: 60 }, dureeBaseSecondes: 70,
    production: { ressource: "argent", parHeure: 90 }
  },
  entrepot: {
    nom: "Entrepot Royal", categorie: "economie", zone: "interieur",
    niveauMax: 18, palaisRequis: 1,
    role: "Augmente ta capacite de stockage et protege une partie de tes ressources du pillage.",
    coutBase: { argent: 70, bois: 150, pierre: 150, fer: 30 }, dureeBaseSecondes: 55,
    capaciteBase: 5000, protectionParNiveau: 2500
  },
  marche: {
    nom: "Grand Marche de la Teranga", categorie: "economie", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 1,
    role: "Echange tes ressources excedentaires contre celles qui te manquent. Le taux s'ameliore avec le niveau.",
    coutBase: { argent: 150, bois: 120, pierre: 60, fer: 20 }, dureeBaseSecondes: 60,
    tauxEchangeBase: 0.45, tauxEchangeParNiveau: 0.04
  },
  caravane_royale: {
    nom: "Caravane Royale", categorie: "economie", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 3,
    role: "Forme les transporteurs et augmente la capacite de charge de toutes tes armees.",
    coutBase: { argent: 300, bois: 350, pierre: 150, fer: 100 }, dureeBaseSecondes: 140,
    chargeParNiveau: 4
  },

  // ================= MILITAIRE =================
  caserne: {
    nom: "Caserne Royale", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 20, palaisRequis: 1,
    role: "Forme ouvriers, miliciens et infanterie. Son niveau determine le palier de toutes tes troupes.",
    coutBase: { argent: 150, bois: 150, pierre: 50, fer: 30 }, dureeBaseSecondes: 60
  },
  camp_lanciers: {
    nom: "Camp des Lanciers", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 2,
    role: "Forme les lanciers, remparts vivants contre les charges de cavalerie.",
    coutBase: { argent: 160, bois: 180, pierre: 60, fer: 50 }, dureeBaseSecondes: 70
  },
  terrain_archers: {
    nom: "Terrain des Archers", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 2,
    role: "Forme les archers, redoutables a distance mais fragiles au corps a corps.",
    coutBase: { argent: 170, bois: 200, pierre: 50, fer: 40 }, dureeBaseSecondes: 70
  },
  ecurie: {
    nom: "Ecurie Royale", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 4,
    role: "Forme la cavalerie legere et lourde, rapide sur la carte et devastatrice en raid.",
    coutBase: { argent: 250, bois: 220, pierre: 100, fer: 120 }, dureeBaseSecondes: 110
  },
  atelier_siege: {
    nom: "Atelier de Siege", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 6, prerequis: { forge: 3 },
    role: "Construit balistes et catapultes, lentes et couteuses mais fatales aux fortifications.",
    coutBase: { argent: 400, bois: 500, pierre: 300, fer: 250 }, dureeBaseSecondes: 180
  },
  atelier_beliers: {
    nom: "Atelier des Beliers", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 5,
    role: "Construit les beliers, faits pour enfoncer portes et murailles ennemies.",
    coutBase: { argent: 320, bois: 450, pierre: 220, fer: 180 }, dureeBaseSecondes: 150
  },
  maison_eclaireurs: {
    nom: "Maison des Eclaireurs", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 3,
    role: "Forme les eclaireurs et ameliore la precision des rapports d'espionnage.",
    coutBase: { argent: 200, bois: 180, pierre: 90, fer: 60 }, dureeBaseSecondes: 90,
    precisionEspionnageParNiveau: 6
  },
  hopital: {
    nom: "Maison des Guerisseurs", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 4,
    role: "Soigne une part de tes blesses apres chaque bataille au lieu de les perdre.",
    coutBase: { argent: 220, bois: 200, pierre: 150, fer: 40 }, dureeBaseSecondes: 100,
    soinParNiveau: 3
  },
  salle_commandants: {
    nom: "Salle des Commandants", categorie: "militaire", zone: "interieur",
    unique: true, niveauMax: 12, palaisRequis: 5,
    role: "Organise tes armees. Chaque niveau permet de mener davantage de marches simultanees.",
    coutBase: { argent: 450, bois: 300, pierre: 300, fer: 200 }, dureeBaseSecondes: 200,
    marchesParTroisNiveaux: 1
  },

  // ================= DEFENSE =================
  muraille: {
    nom: "Muraille Royale", categorie: "defense", zone: "interieur",
    unique: true, fixe: true, emplacementFixe: 1, niveauMax: 20, palaisRequis: 1,
    role: "Premiere protection de la cite. Augmente la defense de toute ta garnison.",
    coutBase: { argent: 100, bois: 60, pierre: 180, fer: 40 }, dureeBaseSecondes: 75,
    defenseParNiveau: 8
  },
  tour_garde: {
    nom: "Tours de Garde", categorie: "defense", zone: "interieur",
    niveauMax: 15, palaisRequis: 3,
    role: "Surveille les alentours. Detecte les armees ennemies qui approchent et renforce la defense.",
    coutBase: { argent: 200, bois: 150, pierre: 250, fer: 60 }, dureeBaseSecondes: 90,
    defenseParNiveau: 4, porteeDetectionParNiveau: 25
  },
  tours_archers: {
    nom: "Tours des Archers", categorie: "defense", zone: "interieur",
    niveauMax: 15, palaisRequis: 5, prerequis: { terrain_archers: 3 },
    role: "Tirent automatiquement sur les assaillants. Tres efficaces contre les unites legeres.",
    coutBase: { argent: 280, bois: 220, pierre: 320, fer: 140 }, dureeBaseSecondes: 130,
    degatsDefensifsParNiveau: 45
  },
  porte_fortifiee: {
    nom: "Porte Fortifiee", categorie: "defense", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 6, prerequis: { muraille: 5 },
    role: "Verrouille l'entree de la cite. Les engins de siege doivent la briser avant d'entrer.",
    coutBase: { argent: 350, bois: 250, pierre: 500, fer: 220 }, dureeBaseSecondes: 190,
    resistanceSiegeParNiveau: 10
  },
  bastion_royal: {
    nom: "Bastion Royal", categorie: "defense", zone: "interieur",
    unique: true, niveauMax: 12, palaisRequis: 10, prerequis: { muraille: 8, porte_fortifiee: 4 },
    role: "Coeur militaire de la capitale. Renforce massivement la resistance et les troupes en defense.",
    coutBase: { argent: 900, bois: 700, pierre: 1200, fer: 600 }, dureeBaseSecondes: 420,
    defenseParNiveau: 15
  },

  // ================= HEROS =================
  taverne: {
    nom: "Taverne des Heros", categorie: "heros", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 3,
    role: "Recrute de nouveaux heros. Un haut niveau ameliore les chances d'obtenir une rarete elevee.",
    coutBase: { argent: 280, bois: 220, pierre: 120, fer: 60 }, dureeBaseSecondes: 110
  },
  palais_heros: {
    nom: "Palais des Heros", categorie: "heros", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 5, prerequis: { taverne: 3 },
    role: "Gere niveaux, etoiles et competences de tes heros, et accelere leur progression.",
    coutBase: { argent: 500, bois: 350, pierre: 300, fer: 180 }, dureeBaseSecondes: 220,
    experienceHerosParNiveau: 5
  },
  forge: {
    nom: "Forge Royale", categorie: "heros", zone: "interieur",
    unique: true, niveauMax: 18, palaisRequis: 2,
    role: "Fabrique armes, armures, casques, anneaux et amulettes pour tes heros.",
    coutBase: { argent: 150, bois: 80, pierre: 100, fer: 80 }, dureeBaseSecondes: 60
  },

  // ================= SAVOIR =================
  academie: {
    nom: "Academie des Savoirs", categorie: "administration", zone: "interieur",
    unique: true, niveauMax: 20, palaisRequis: 2,
    role: "Centre de recherche. Son niveau determine les technologies accessibles a ton empire.",
    coutBase: { argent: 200, bois: 100, pierre: 120, fer: 60 }, dureeBaseSecondes: 90
  },

  // ================= DIPLOMATIE =================
  ambassade: {
    nom: "Ambassade Royale", categorie: "diplomatie", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 3,
    role: "Ouvre la diplomatie. Permet de fonder une alliance et fixe le nombre de membres accueillis.",
    coutBase: { argent: 300, bois: 250, pierre: 200, fer: 80 }, dureeBaseSecondes: 120,
    membresAllianceParNiveau: 5
  },
  maison_alliance: {
    nom: "Maison de l'Alliance", categorie: "diplomatie", zone: "interieur",
    unique: true, niveauMax: 12, palaisRequis: 6, prerequis: { ambassade: 4 },
    role: "Centre collectif de l'alliance : dons, technologies communes et projets de guerre.",
    coutBase: { argent: 600, bois: 450, pierre: 400, fer: 250 }, dureeBaseSecondes: 260,
    bonusAllianceParNiveau: 2
  },

  // ================= PRESTIGE =================
  temple: {
    nom: "Temple Royal", categorie: "prestige", zone: "interieur",
    unique: true, niveauMax: 15, palaisRequis: 5,
    role: "Benediction des ancetres : accroit le prestige gagne a chaque victoire.",
    coutBase: { argent: 350, bois: 200, pierre: 350, fer: 100 }, dureeBaseSecondes: 150,
    prestigeParNiveau: 3
  },
  monument_jambar: {
    nom: "Monument du Jambar", categorie: "prestige", zone: "interieur",
    unique: true, niveauMax: 10, palaisRequis: 12, prerequis: { temple: 5, bastion_royal: 3 },
    role: "Symbole de ta gloire. Accorde un bonus permanent a la production, a l'attaque et au prestige.",
    coutBase: { argent: 2000, bois: 1500, pierre: 2500, fer: 1200 }, dureeBaseSecondes: 900,
    bonusGlobalParNiveau: 3
  }
};

const MULTIPLICATEUR_COUT = 1.5;
const MULTIPLICATEUR_DUREE = 1.3;
const MULTIPLICATEUR_PRODUCTION = 1.4;
const MULTIPLICATEUR_CAPACITE = 1.5;

// Seuls ces deux batiments existent a la fondation, au niveau 0
const BATIMENTS_DE_DEPART = [
  { type: "palais_royal", zone: "interieur", emplacement: 0, niveau: 0 },
  { type: "muraille", zone: "interieur", emplacement: 1, niveau: 0 }
];

function calculerCout(type, niveauActuel) {
  const config = BATIMENTS_CONFIG[type];
  if (!config) return null;
  const cout = {};
  for (const [ressource, valeurBase] of Object.entries(config.coutBase)) {
    cout[ressource] = Math.round(valeurBase * Math.pow(MULTIPLICATEUR_COUT, niveauActuel));
  }
  return cout;
}

function calculerDureeSecondes(type, niveauActuel) {
  const config = BATIMENTS_CONFIG[type];
  if (!config) return null;
  return Math.round(config.dureeBaseSecondes * Math.pow(MULTIPLICATEUR_DUREE, niveauActuel));
}

function productionParHeure(type, niveau) {
  const config = BATIMENTS_CONFIG[type];
  if (!config?.production || niveau <= 0) return null;
  return {
    ressource: config.production.ressource,
    quantite: Math.round(config.production.parHeure * Math.pow(MULTIPLICATEUR_PRODUCTION, niveau - 1))
  };
}

function capaciteStockage(niveauEntrepot) {
  const base = BATIMENTS_CONFIG.entrepot.capaciteBase;
  if (niveauEntrepot <= 0) return base;
  return Math.round(base * Math.pow(MULTIPLICATEUR_CAPACITE, niveauEntrepot - 1));
}

function batimentsDeZone(zone) {
  return Object.entries(BATIMENTS_CONFIG)
    .filter(([, c]) => c.zone === zone && !c.fixe)
    .map(([code, c]) => ({ code, ...c }));
}

// ---------- Effets cumules sur la cite ----------
function sommeEffet(ville, champ) {
  let total = 0;
  for (const b of ville.batiments || []) {
    const c = BATIMENTS_CONFIG[b.type];
    if (c?.[champ]) total += c[champ] * b.niveau;
  }
  return total;
}

const POPULATION_BASE = 200;
function populationMax(ville) {
  return POPULATION_BASE + sommeEffet(ville, "populationParNiveau");
}

// Le moral (Conseil Royal, Place Royale) accroit toute la production
function moral(ville) {
  return Math.min(60, sommeEffet(ville, "moralParNiveau"));
}

function ressourcesProtegees(ville) {
  return sommeEffet(ville, "protectionParNiveau");
}

// Muraille, Tours de Garde, Bastion
function bonusDefenseCite(ville) {
  return 1 + sommeEffet(ville, "defenseParNiveau") / 100;
}

// Tours des Archers : degats infliges automatiquement aux assaillants
function degatsDefensifs(ville) {
  return sommeEffet(ville, "degatsDefensifsParNiveau");
}

function tauxSoin(ville) {
  return Math.min(0.5, sommeEffet(ville, "soinParNiveau") / 100);
}

function bonusPrestige(ville) {
  return 1 + (sommeEffet(ville, "prestigeParNiveau") + sommeEffet(ville, "bonusGlobalParNiveau")) / 100;
}

function bonusCharge(ville) {
  return 1 + sommeEffet(ville, "chargeParNiveau") / 100;
}

function marchesMax(ville) {
  const niveau = ville.batiments?.find((b) => b.type === "salle_commandants")?.niveau || 0;
  return 3 + Math.floor(niveau / 3);
}

function membresAllianceMax(niveauAmbassade) {
  return 10 + (BATIMENTS_CONFIG.ambassade.membresAllianceParNiveau || 5) * niveauAmbassade;
}

function tauxEchange(niveauMarche) {
  const c = BATIMENTS_CONFIG.marche;
  if (niveauMarche <= 0) return 0;
  return Math.min(0.92, c.tauxEchangeBase + niveauMarche * c.tauxEchangeParNiveau);
}

function porteeDetection(ville) {
  return sommeEffet(ville, "porteeDetectionParNiveau");
}

module.exports = {
  BATIMENTS_CONFIG, CATEGORIES, BATIMENTS_DE_DEPART,
  NB_EMPLACEMENTS_INTERIEUR, NB_EMPLACEMENTS_EXTERIEUR,
  calculerCout, calculerDureeSecondes, productionParHeure, capaciteStockage,
  batimentsDeZone, populationMax, moral, ressourcesProtegees, bonusDefenseCite,
  degatsDefensifs, tauxSoin, bonusPrestige, bonusCharge, marchesMax,
  membresAllianceMax, tauxEchange, porteeDetection
};
