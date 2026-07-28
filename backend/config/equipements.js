// Equipements des heros de Jambar Empire.
// 5 emplacements x plusieurs objets, 5 raretes.

const EMPLACEMENTS = {
  arme: "Arme",
  armure: "Armure",
  casque: "Casque",
  anneau: "Anneau",
  amulette: "Amulette"
};

const RARETES = {
  commun:     { nom: "Commun",     multiplicateur: 1.0, couleur: "#B8B2A4", poids: 45 },
  rare:       { nom: "Rare",       multiplicateur: 1.5, couleur: "#5DA9E9", poids: 28 },
  epique:     { nom: "Epique",     multiplicateur: 2.2, couleur: "#A96BE0", poids: 16 },
  legendaire: { nom: "Legendaire", multiplicateur: 3.2, couleur: "#E3B23C", poids: 8 },
  mythique:   { nom: "Mythique",   multiplicateur: 4.5, couleur: "#E8837A", poids: 3 }
};

const OBJETS = [
  // Armes
  { code: "lance_jambar", nom: "Lance du Jambar", emplacement: "arme",
    base: { attaque: 12, defense: 2 }, description: "La lance des guerriers du continent." },
  { code: "epee_lion", nom: "Epee du Lion", emplacement: "arme",
    base: { attaque: 14 }, description: "Lame gravee d'un lion rugissant." },
  { code: "arc_savane", nom: "Arc de la Savane", emplacement: "arme",
    base: { attaque: 11, leadership: 3 }, description: "Arc long taille dans le bois d'ebene." },

  // Armures
  { code: "cotte_bronze", nom: "Cotte de Bronze", emplacement: "armure",
    base: { defense: 12, sante: 6 }, description: "Armure de bronze martelee." },
  { code: "plastron_or", nom: "Plastron d'Or", emplacement: "armure",
    base: { defense: 15, sante: 8 }, description: "Plastron ceremoniel des rois." },
  { code: "tunique_cuir", nom: "Tunique de Cuir", emplacement: "armure",
    base: { defense: 8, vitesse: 5 }, description: "Legere et souple, pour les eclaireurs." },

  // Casques
  { code: "casque_royal", nom: "Casque Royal", emplacement: "casque",
    base: { defense: 8, leadership: 5 }, description: "Casque orne de motifs geometriques." },
  { code: "coiffe_guerre", nom: "Coiffe de Guerre", emplacement: "casque",
    base: { defense: 6, attaque: 4 }, description: "Coiffe traditionnelle des chefs de guerre." },

  // Anneaux
  { code: "anneau_baobab", nom: "Anneau du Baobab", emplacement: "anneau",
    base: { sante: 10, leadership: 4 }, description: "Symbole de longevite et de sagesse." },
  { code: "anneau_fleuve", nom: "Anneau du Fleuve", emplacement: "anneau",
    base: { vitesse: 8, defense: 3 }, description: "Grave de vagues, il allege le pas." },

  // Amulettes
  { code: "amulette_lion", nom: "Amulette du Lion", emplacement: "amulette",
    base: { attaque: 8, leadership: 6 }, description: "Le courage du lion au cou de son porteur." },
  { code: "amulette_ancetres", nom: "Amulette des Ancetres", emplacement: "amulette",
    base: { sante: 12, defense: 5 }, description: "Protegee par la benediction des anciens." }
];

// Cout de fabrication a la Forge, selon la rarete visee
const COUT_FABRICATION = { argent: 400, fer: 300, bois: 150, pierre: 150 };
const DUREE_FABRICATION_SECONDES = 120;

function trouverObjet(code) {
  return OBJETS.find((o) => o.code === code) || null;
}

// Stats reelles = base x rarete x niveau (+10% par niveau)
function calculerStats(codeObjet, rarete, niveau = 1) {
  const objet = trouverObjet(codeObjet);
  if (!objet) return null;
  const multRarete = RARETES[rarete]?.multiplicateur || 1;
  const multNiveau = 1 + (niveau - 1) * 0.1;
  const stats = {};
  for (const [cle, valeur] of Object.entries(objet.base)) {
    stats[cle] = Math.round(valeur * multRarete * multNiveau);
  }
  return stats;
}

// Tirage d'un objet a la fabrication (rarete ponderee)
function tirerObjet(niveauForge = 1) {
  const objet = OBJETS[Math.floor(Math.random() * OBJETS.length)];

  // Une forge de haut niveau ameliore les chances de rarete
  const bonusForge = Math.min(3, 1 + (niveauForge - 1) * 0.15);
  const pool = Object.entries(RARETES).map(([code, r]) => {
    let poids = r.poids;
    if (["epique", "legendaire", "mythique"].includes(code)) poids *= bonusForge;
    return { code, poids };
  });

  const total = pool.reduce((s, p) => s + p.poids, 0);
  let tirage = Math.random() * total;
  for (const p of pool) {
    tirage -= p.poids;
    if (tirage <= 0) return { code: objet.code, rarete: p.code };
  }
  return { code: objet.code, rarete: "commun" };
}

// Cumule les stats de tous les objets equipes sur un heros
function bonusEquipement(objets = []) {
  const total = {};
  for (const o of objets) {
    const stats = calculerStats(o.codeObjet, o.rarete, o.niveau);
    if (!stats) continue;
    for (const [cle, valeur] of Object.entries(stats)) {
      total[cle] = (total[cle] || 0) + valeur;
    }
  }
  return total;
}

module.exports = {
  EMPLACEMENTS,
  RARETES,
  OBJETS,
  COUT_FABRICATION,
  DUREE_FABRICATION_SECONDES,
  trouverObjet,
  calculerStats,
  tirerObjet,
  bonusEquipement
};
