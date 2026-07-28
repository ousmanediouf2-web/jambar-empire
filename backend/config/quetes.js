// Systeme de quetes de Jambar Empire.
// La progression est calculee a la demande depuis l'etat reel du joueur,
// il n'y a donc rien a "tracker" en permanence.

const CATEGORIES = {
  principale: { nom: "Quetes principales", couleur: "#E3B23C" },
  quotidienne: { nom: "Quetes quotidiennes", couleur: "#5DCAA5" },
  hebdomadaire: { nom: "Quetes hebdomadaires", couleur: "#A96BE0" }
};

// condition.type :
//   batiment_niveau  : cible = { batiment, niveau }
//   troupes_total    : cible = nombre d'unites en garnison
//   heros_total      : cible = nombre de heros possedes
//   victoires        : cible = nombre de victoires en campagne
//   recherche_totale : cible = somme des niveaux de recherche
//   prestige         : cible = points de prestige
//   alliance         : appartenir a une alliance
//   marches          : cible = nombre de collectes terminees

const QUETES = [
  // --- PRINCIPALES (progression du joueur) ---
  { code: "palais_3", categorie: "principale", titre: "Un palais digne d'un roi",
    description: "Ameliore ton Palais Royal jusqu'au niveau 3.",
    condition: { type: "batiment_niveau", batiment: "palais_royal", cible: 3 },
    recompense: { argent: 800, bois: 500, pierre: 500, prestige: 50 } },
  { code: "palais_5", categorie: "principale", titre: "Le siege du pouvoir",
    description: "Ameliore ton Palais Royal jusqu'au niveau 5.",
    condition: { type: "batiment_niveau", batiment: "palais_royal", cible: 5 },
    recompense: { argent: 2000, fer: 800, pierre: 1200, prestige: 150 } },
  { code: "caserne_3", categorie: "principale", titre: "Forger une armee",
    description: "Ameliore ta Caserne jusqu'au niveau 3 pour debloquer le palier Soldat.",
    condition: { type: "batiment_niveau", batiment: "caserne", cible: 3 },
    recompense: { ble: 800, fer: 400, prestige: 60 } },
  { code: "academie_3", categorie: "principale", titre: "Le savoir avant la force",
    description: "Ameliore ton Academie jusqu'au niveau 3.",
    condition: { type: "batiment_niveau", batiment: "academie", cible: 3 },
    recompense: { argent: 1000, bois: 600, prestige: 70 } },
  { code: "premiere_armee", categorie: "principale", titre: "Premiere armee",
    description: "Rassemble 100 unites en garnison.",
    condition: { type: "troupes_total", cible: 100 },
    recompense: { ble: 1000, fer: 500, prestige: 80 } },
  { code: "grande_armee", categorie: "principale", titre: "La grande armee",
    description: "Rassemble 500 unites en garnison.",
    condition: { type: "troupes_total", cible: 500 },
    recompense: { ble: 3000, fer: 2000, argent: 2000, prestige: 250 } },
  { code: "premier_heros", categorie: "principale", titre: "Premier champion",
    description: "Recrute ton premier heros a la Taverne.",
    condition: { type: "heros_total", cible: 1 },
    recompense: { argent: 600, prestige: 40 } },
  { code: "cinq_heros", categorie: "principale", titre: "Une cour de champions",
    description: "Rassemble 5 heros a ta cour.",
    condition: { type: "heros_total", cible: 5 },
    recompense: { argent: 2500, or: 10, prestige: 200 } },
  { code: "premiere_victoire", categorie: "principale", titre: "Bapteme du feu",
    description: "Remporte ta premiere bataille contre un camp ennemi.",
    condition: { type: "victoires", cible: 1 },
    recompense: { argent: 500, ble: 500, prestige: 50 } },
  { code: "dix_victoires", categorie: "principale", titre: "Conquerant",
    description: "Remporte 10 batailles contre les camps ennemis.",
    condition: { type: "victoires", cible: 10 },
    recompense: { argent: 3000, fer: 1500, prestige: 300 } },
  { code: "premiere_recherche", categorie: "principale", titre: "Les fondements du savoir",
    description: "Termine 5 niveaux de recherche a l'Academie.",
    condition: { type: "recherche_totale", cible: 5 },
    recompense: { argent: 1200, bois: 800, prestige: 100 } },
  { code: "rejoindre_alliance", categorie: "principale", titre: "L'union fait la force",
    description: "Rejoins ou fonde une alliance.",
    condition: { type: "alliance", cible: 1 },
    recompense: { argent: 1000, ble: 800, prestige: 80 } },

  // --- QUOTIDIENNES ---
  { code: "quotidien_troupes", categorie: "quotidienne", titre: "Recrutement du jour",
    description: "Maintiens au moins 50 unites en garnison.",
    condition: { type: "troupes_total", cible: 50 },
    recompense: { ble: 400, argent: 300 }, repetable: true },
  { code: "quotidien_collecte", categorie: "quotidienne", titre: "Caravane du jour",
    description: "Termine 3 collectes de ressources sur la carte.",
    condition: { type: "marches", cible: 3 },
    recompense: { bois: 500, pierre: 400 }, repetable: true },
  { code: "quotidien_victoire", categorie: "quotidienne", titre: "Patrouille du jour",
    description: "Remporte 3 batailles contre des camps ennemis.",
    condition: { type: "victoires", cible: 3 },
    recompense: { argent: 600, fer: 300 }, repetable: true },

  // --- HEBDOMADAIRES ---
  { code: "hebdo_prestige", categorie: "hebdomadaire", titre: "Renommee grandissante",
    description: "Atteins 500 points de prestige.",
    condition: { type: "prestige", cible: 500 },
    recompense: { argent: 2500, or: 5, prestige: 100 } },
  { code: "hebdo_recherche", categorie: "hebdomadaire", titre: "Academicien",
    description: "Cumule 20 niveaux de recherche.",
    condition: { type: "recherche_totale", cible: 20 },
    recompense: { argent: 3000, bois: 2000, pierre: 2000 } },
  { code: "hebdo_armee", categorie: "hebdomadaire", titre: "Puissance militaire",
    description: "Rassemble 1000 unites en garnison.",
    condition: { type: "troupes_total", cible: 1000 },
    recompense: { ble: 5000, fer: 3000, or: 8 } }
];

function trouverQuete(code) {
  return QUETES.find((q) => q.code === code) || null;
}

module.exports = { CATEGORIES, QUETES, trouverQuete };
