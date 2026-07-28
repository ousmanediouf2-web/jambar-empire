// Evenements actifs et bonus qu'ils appliquent reellement au jeu.

const Evenement = require("../models/Evenement");

const EFFETS = {
  bonus_production: { libelle: "Production doublee", multiplicateurProduction: 2 },
  double_xp: { libelle: "Prestige double", multiplicateurPrestige: 2 },
  tournoi: { libelle: "Tournoi en cours", multiplicateurPrestige: 1.5 },
  bataille_speciale: { libelle: "Bataille speciale", multiplicateurButin: 2 }
};

async function evenementsActifs() {
  const maintenant = new Date();
  return Evenement.find({
    actif: true,
    dateDebut: { $lte: maintenant },
    dateFin: { $gte: maintenant }
  }).lean();
}

// Cumule les multiplicateurs de tous les evenements en cours
async function bonusActifs() {
  const evenements = await evenementsActifs();
  const bonus = {
    multiplicateurProduction: 1,
    multiplicateurPrestige: 1,
    multiplicateurButin: 1,
    evenements: []
  };

  for (const ev of evenements) {
    const effet = EFFETS[ev.type];
    if (!effet) continue;
    if (effet.multiplicateurProduction) bonus.multiplicateurProduction *= effet.multiplicateurProduction;
    if (effet.multiplicateurPrestige) bonus.multiplicateurPrestige *= effet.multiplicateurPrestige;
    if (effet.multiplicateurButin) bonus.multiplicateurButin *= effet.multiplicateurButin;
    bonus.evenements.push({
      _id: ev._id,
      titre: ev.titre,
      description: ev.description,
      type: ev.type,
      effet: effet.libelle,
      dateDebut: ev.dateDebut,
      dateFin: ev.dateFin
    });
  }

  return bonus;
}

module.exports = { EFFETS, evenementsActifs, bonusActifs };
