// Catalogue des objets consommables de Jambar Empire.
// Inspire des standards du genre : accelerateurs, boucliers, coffres,
// teleporteurs, pierres de recherche.

const CATEGORIES = {
  acceleration: { nom: "Accelerations", couleur: "#5DCAA5" },
  protection:   { nom: "Protections", couleur: "#5DA9E9" },
  ressource:    { nom: "Coffres de ressources", couleur: "#E3B23C" },
  deplacement:  { nom: "Deplacement", couleur: "#A96BE0" },
  special:      { nom: "Objets speciaux", couleur: "#E8837A" }
};

// cible : ou l'acceleration s'applique
//   toutes | construction | recherche | entrainement | soin
const OBJETS = {
  // ---------- ACCELERATIONS ----------
  accel_5m:   { nom: "Acceleration 5 min", categorie: "acceleration", cible: "toutes", secondes: 300,
                icone: "⏱", prixOr: 2,
                description: "Reduit de 5 minutes n'importe quels travaux en cours." },
  accel_15m:  { nom: "Acceleration 15 min", categorie: "acceleration", cible: "toutes", secondes: 900,
                icone: "⏱", prixOr: 5,
                description: "Reduit de 15 minutes n'importe quels travaux en cours." },
  accel_1h:   { nom: "Acceleration 1 h", categorie: "acceleration", cible: "toutes", secondes: 3600,
                icone: "⏱", prixOr: 18,
                description: "Reduit d'une heure n'importe quels travaux en cours." },
  accel_3h:   { nom: "Acceleration 3 h", categorie: "acceleration", cible: "toutes", secondes: 10800,
                icone: "⏳", prixOr: 48,
                description: "Reduit de 3 heures n'importe quels travaux en cours." },
  accel_8h:   { nom: "Acceleration 8 h", categorie: "acceleration", cible: "toutes", secondes: 28800,
                icone: "⏳", prixOr: 120,
                description: "Reduit de 8 heures n'importe quels travaux en cours." },
  accel_24h:  { nom: "Acceleration 24 h", categorie: "acceleration", cible: "toutes", secondes: 86400,
                icone: "⌛", prixOr: 320,
                description: "Reduit d'une journee entiere n'importe quels travaux." },

  accel_const_1h:  { nom: "Acceleration de construction 1 h", categorie: "acceleration", cible: "construction", secondes: 3600,
                     icone: "🔨", prixOr: 14,
                description: "Reduit d'une heure une construction en cours." },
  accel_const_8h:  { nom: "Acceleration de construction 8 h", categorie: "acceleration", cible: "construction", secondes: 28800,
                     icone: "🔨", prixOr: 95,
                description: "Reduit de 8 heures une construction en cours." },
  accel_rech_1h:   { nom: "Acceleration de recherche 1 h", categorie: "acceleration", cible: "recherche", secondes: 3600,
                     icone: "📜", prixOr: 14,
                description: "Reduit d'une heure une recherche a l'Academie." },
  accel_rech_8h:   { nom: "Acceleration de recherche 8 h", categorie: "acceleration", cible: "recherche", secondes: 28800,
                     icone: "📜", prixOr: 95,
                description: "Reduit de 8 heures une recherche a l'Academie." },
  accel_entr_1h:   { nom: "Acceleration de formation 1 h", categorie: "acceleration", cible: "entrainement", secondes: 3600,
                     icone: "⚔", prixOr: 14,
                description: "Reduit d'une heure la formation de troupes." },
  accel_entr_8h:   { nom: "Acceleration de formation 8 h", categorie: "acceleration", cible: "entrainement", secondes: 28800,
                     icone: "⚔", prixOr: 95,
                description: "Reduit de 8 heures la formation de troupes." },

  // ---------- PROTECTIONS ----------
  bouclier_8h:  { nom: "Bouclier de paix 8 h", categorie: "protection", heures: 8,
                  icone: "🛡", prixOr: 40,
                description: "Ta cite ne peut pas etre attaquee pendant 8 heures." },
  bouclier_24h: { nom: "Bouclier de paix 24 h", categorie: "protection", heures: 24,
                  icone: "🛡", prixOr: 100,
                description: "Ta cite ne peut pas etre attaquee pendant une journee." },
  bouclier_3j:  { nom: "Bouclier de paix 3 jours", categorie: "protection", heures: 72,
                  icone: "🛡", prixOr: 260,
                description: "Ta cite ne peut pas etre attaquee pendant 3 jours." },
  bouclier_7j:  { nom: "Bouclier de paix 7 jours", categorie: "protection", heures: 168,
                  icone: "🛡", prixOr: 540,
                description: "Ta cite ne peut pas etre attaquee pendant une semaine." },

  // ---------- COFFRES DE RESSOURCES ----------
  coffre_ble_p:     { nom: "Petit sac de mil", categorie: "ressource", gain: { ble: 2000 },
                      icone: "🌾", prixOr: 6,
                description: "Contient 2 000 unites de nourriture." },
  coffre_ble_g:     { nom: "Grand sac de mil", categorie: "ressource", gain: { ble: 20000 },
                      icone: "🌾", prixOr: 55,
                description: "Contient 20 000 unites de nourriture." },
  coffre_bois_p:    { nom: "Petit fagot de bois", categorie: "ressource", gain: { bois: 2000 },
                      icone: "🪵", prixOr: 6,
                description: "Contient 2 000 unites de bois." },
  coffre_bois_g:    { nom: "Grand fagot de bois", categorie: "ressource", gain: { bois: 20000 },
                      icone: "🪵", prixOr: 55,
                description: "Contient 20 000 unites de bois." },
  coffre_pierre_p:  { nom: "Petit tas de pierre", categorie: "ressource", gain: { pierre: 2000 },
                      icone: "🪨", prixOr: 6,
                description: "Contient 2 000 unites de pierre." },
  coffre_pierre_g:  { nom: "Grand tas de pierre", categorie: "ressource", gain: { pierre: 20000 },
                      icone: "🪨", prixOr: 55,
                description: "Contient 20 000 unites de pierre." },
  coffre_fer_p:     { nom: "Petit coffre de fer", categorie: "ressource", gain: { fer: 1500 },
                      icone: "⛓", prixOr: 8,
                description: "Contient 1 500 unites de fer." },
  coffre_fer_g:     { nom: "Grand coffre de fer", categorie: "ressource", gain: { fer: 15000 },
                      icone: "⛓", prixOr: 70,
                description: "Contient 15 000 unites de fer." },
  coffre_argent_p:  { nom: "Bourse d'argent", categorie: "ressource", gain: { argent: 3000 },
                      icone: "🪙", prixOr: 7,
                description: "Contient 3 000 pieces d'argent." },
  coffre_argent_g:  { nom: "Coffre d'argent", categorie: "ressource", gain: { argent: 30000 },
                      icone: "🪙", prixOr: 65,
                description: "Contient 30 000 pieces d'argent." },
  coffre_royal:     { nom: "Coffre royal", categorie: "ressource",
                      gain: { ble: 15000, bois: 15000, pierre: 12000, fer: 8000, argent: 20000 },
                      icone: "👑", prixOr: 150,
                description: "Un coffre genereux contenant toutes les ressources." },
  sachet_or:        { nom: "Sachet de gemmes", categorie: "ressource", gain: { or: 50 },
                      icone: "💎", prixOr: 0,
                description: "Contient 50 gemmes d'or." },

  // ---------- DEPLACEMENT ----------
  teleporteur_aleatoire: { nom: "Teleporteur aleatoire", categorie: "deplacement", mode: "aleatoire",
                           icone: "🧭", prixOr: 60,
                description: "Deplace ta cite sur une case libre tiree au hasard." },
  teleporteur_cible:     { nom: "Teleporteur cible", categorie: "deplacement", mode: "cible",
                           icone: "🗺", prixOr: 180,
                description: "Deplace ta cite sur une case libre de ton choix." },

  // ---------- SPECIAUX ----------
  pierre_recherche: { nom: "Pierre de savoir", categorie: "special", rechercheSecondes: 3600,
                      icone: "🔮", prixOr: 25,
                description: "Accelere d'une heure la recherche en cours a l'Academie." },
  parchemin_heros:  { nom: "Parchemin d'invocation", categorie: "special", invocationHeros: true,
                      icone: "📯", prixOr: 200,
                description: "Invoque un heros a la Taverne, sans depenser de ressources." }
};

// Objets achetables en gemmes a la boutique
function boutique() {
  return Object.entries(OBJETS)
    .filter(([, o]) => o.prixOr > 0)
    .map(([code, o]) => ({ code, ...o }));
}

function trouverObjet(code) {
  return OBJETS[code] ? { code, ...OBJETS[code] } : null;
}

function catalogue() {
  return Object.entries(OBJETS).map(([code, o]) => ({ code, ...o }));
}

module.exports = { CATEGORIES, OBJETS, trouverObjet, catalogue, boutique };
