// Production de ressources "a la demande" + gestion des emplacements de la cite.

const {
  BATIMENTS_CONFIG,
  moral,
  BATIMENTS_DE_DEPART,
  NB_EMPLACEMENTS_INTERIEUR,
  NB_EMPLACEMENTS_EXTERIEUR,
  productionParHeure,
  capaciteStockage
} = require("../config/batiments");

// Garantit que le Palais Royal et la Muraille existent (fondation ou migration
// des cites creees avant le systeme d'emplacements).
function completerBatiments(ville) {
  let modifie = false;

  for (const depart of BATIMENTS_DE_DEPART) {
    const existant = ville.batiments.find((b) => b.type === depart.type);
    if (!existant) {
      ville.batiments.push({ ...depart, finAmelioration: null });
      modifie = true;
    } else if (existant.emplacement === undefined || existant.zone === undefined) {
      existant.zone = depart.zone;
      existant.emplacement = depart.emplacement;
      modifie = true;
    }
  }

  // Migration : les anciens batiments sans zone/emplacement recoivent
  // automatiquement une place libre dans leur zone d'origine.
  for (const b of ville.batiments) {
    const config = BATIMENTS_CONFIG[b.type];
    if (!config) continue;
    if (!b.zone || b.emplacement === undefined || b.emplacement === null) {
      b.zone = config.zone;
      b.emplacement = prochainEmplacementLibre(ville, config.zone);
      modifie = true;
    }
  }

  return modifie;
}

function prochainEmplacementLibre(ville, zone) {
  const max = zone === "exterieur" ? NB_EMPLACEMENTS_EXTERIEUR : NB_EMPLACEMENTS_INTERIEUR;
  const occupes = new Set(
    ville.batiments.filter((b) => b.zone === zone).map((b) => b.emplacement)
  );
  for (let i = 0; i < max; i++) {
    if (!occupes.has(i)) return i;
  }
  return -1;
}

function niveauBatiment(ville, type) {
  return ville.batiments?.find((b) => b.type === type)?.niveau ?? 0;
}

function productionVille(ville) {
  const total = {};
  for (const b of ville.batiments || []) {
    const prod = productionParHeure(b.type, b.niveau);
    if (prod) total[prod.ressource] = (total[prod.ressource] || 0) + prod.quantite;
  }
  return total;
}

function appliquerProduction(ville, multiplicateurEvenement = 1, bonusRecherche = {}) {
  const maintenant = new Date();

  if (!ville.derniereProduction) {
    ville.derniereProduction = maintenant;
    return {};
  }

  const secondesEcoulees = (maintenant - ville.derniereProduction) / 1000;
  if (secondesEcoulees < 1) return {};

  const parHeure = productionVille(ville);
  const bonusMoral = 1 + moral(ville) / 100;
  const bonusStockage = 1 + (bonusRecherche.capacite_stockage || 0) / 100;
  const capacite = Math.round(capaciteStockage(niveauBatiment(ville, "entrepot")) * bonusStockage);
  const gains = {};

  for (const [ressource, quantiteHeure] of Object.entries(parHeure)) {
    const bonusRessource = 1 + (bonusRecherche["production_" + ressource] || 0) / 100;
    const gain = Math.floor((quantiteHeure * multiplicateurEvenement * bonusRessource * bonusMoral * secondesEcoulees) / 3600);
    if (gain <= 0) continue;

    const actuel = ville.ressources[ressource] || 0;
    if (actuel >= capacite) continue;

    const nouveau = Math.min(capacite, actuel + gain);
    const gainReel = nouveau - actuel;
    if (gainReel > 0) {
      ville.ressources[ressource] = nouveau;
      gains[ressource] = gainReel;
    }
  }

  ville.derniereProduction = maintenant;
  return gains;
}

async function rafraichirVille(ville, multiplicateurEvenement = 1, bonusRecherche = {}) {
  const batimentsAjoutes = completerBatiments(ville);
  const gains = appliquerProduction(ville, multiplicateurEvenement, bonusRecherche);
  if (batimentsAjoutes || Object.keys(gains).length > 0) {
    await ville.save();
  }
  const bonusStockage = 1 + (bonusRecherche.capacite_stockage || 0) / 100;
  return {
    gains,
    moral: moral(ville),
    production: productionVille(ville),
    capacite: Math.round(capaciteStockage(niveauBatiment(ville, "entrepot")) * bonusStockage)
  };
}

module.exports = {
  completerBatiments,
  prochainEmplacementLibre,
  productionVille,
  appliquerProduction,
  rafraichirVille,
  niveauBatiment
};
