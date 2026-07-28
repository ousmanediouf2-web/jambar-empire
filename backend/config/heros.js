// Catalogue des heros de Jambar Empire.
// Chaque heros a une rarete, une specialite et des stats de base.
// Les stats reelles d'un heros recrute = stats de base + progression de niveau.

const RARETES = {
  commun: { multiplicateur: 1.0, poidsTirage: 50, couleur: "#B8B2A4" },
  rare: { multiplicateur: 1.35, poidsTirage: 30, couleur: "#5DA9E9" },
  epique: { multiplicateur: 1.8, poidsTirage: 15, couleur: "#A96BE0" },
  legendaire: { multiplicateur: 2.5, poidsTirage: 5, couleur: "#E3B23C" }
};

const CATALOGUE_HEROS = [
  // Legendaires
  { code: "sunu_diouf", nom: "Sunu Diouf", rarete: "legendaire", specialite: "Leadership et defense", typeFavori: "infanterie",
    base: { attaque: 42, defense: 58, sante: 60, leadership: 55, vitesse: 30 },
    histoire: "Roi legendaire du Walo, reconnu pour sa muraille humaine qui n'a jamais cede." },
  { code: "lat_dior", nom: "Lat Dior", rarete: "legendaire", specialite: "Attaque rapide et cavalerie", typeFavori: "cavalerie",
    base: { attaque: 60, defense: 35, sante: 48, leadership: 50, vitesse: 58 },
    histoire: "Cavalier insaisissable, il frappait a l'aube et disparaissait avant midi." },
  { code: "ndeye_yacine", nom: "Ndeye Yacine", rarete: "legendaire", specialite: "Archers et recherche", typeFavori: "archers",
    base: { attaque: 55, defense: 38, sante: 45, leadership: 58, vitesse: 42 },
    histoire: "Reine stratege, ses fleches tombaient la ou son esprit les avait deja envoyees." },

  // Epiques
  { code: "baaba_malick", nom: "Baaba Malick", rarete: "epique", specialite: "Infanterie et defense", typeFavori: "infanterie",
    base: { attaque: 38, defense: 52, sante: 55, leadership: 40, vitesse: 28 },
    histoire: "Ancien maitre de guerre, il formait les soldats avant de les mener au combat." },
  { code: "fatu_binta", nom: "Fatu Binta", rarete: "epique", specialite: "Mobilite et soutien", typeFavori: "cavalerie",
    base: { attaque: 45, defense: 36, sante: 44, leadership: 48, vitesse: 55 },
    histoire: "Commandante royale, elle arrivait toujours la ou on ne l'attendait plus." },
  { code: "modou_faye", nom: "Modou Faye", rarete: "epique", specialite: "Lanciers et formation", typeFavori: "lanciers",
    base: { attaque: 44, defense: 46, sante: 50, leadership: 42, vitesse: 34 },
    histoire: "Maitre du mur de lances, sa formation brisait toute charge de cavalerie." },
  { code: "aminata_sow", nom: "Aminata Sow", rarete: "epique", specialite: "Economie et logistique", typeFavori: "archers",
    base: { attaque: 36, defense: 40, sante: 46, leadership: 54, vitesse: 40 },
    histoire: "Intendante du royaume, aucune armee ne manqua jamais de vivres sous sa charge." },

  // Rares
  { code: "ousmane_ba", nom: "Ousmane Ba", rarete: "rare", specialite: "Infanterie", typeFavori: "infanterie",
    base: { attaque: 32, defense: 40, sante: 44, leadership: 30, vitesse: 26 },
    histoire: "Sergent du Baol, respecte pour son calme sous le feu." },
  { code: "khady_ndiaye", nom: "Khady Ndiaye", rarete: "rare", specialite: "Archers", typeFavori: "archers",
    base: { attaque: 40, defense: 28, sante: 36, leadership: 34, vitesse: 38 },
    histoire: "Archere du Sine, elle apprit a viser en gardant les troupeaux." },
  { code: "samba_gueye", nom: "Samba Gueye", rarete: "rare", specialite: "Cavalerie", typeFavori: "cavalerie",
    base: { attaque: 42, defense: 26, sante: 34, leadership: 30, vitesse: 46 },
    histoire: "Eclaireur du Fouta, plus rapide que les nouvelles elles-memes." },
  { code: "penda_sarr", nom: "Penda Sarr", rarete: "rare", specialite: "Lanciers", typeFavori: "lanciers",
    base: { attaque: 34, defense: 38, sante: 40, leadership: 32, vitesse: 30 },
    histoire: "Fille de forgeron, elle savait ou frapper une armure." },
  { code: "ibrahima_kane", nom: "Ibrahima Kane", rarete: "rare", specialite: "Defense de muraille", typeFavori: "infanterie",
    base: { attaque: 28, defense: 44, sante: 46, leadership: 32, vitesse: 22 },
    histoire: "Gardien de la porte est, il ne dormit pas pendant le siege de Tekrour." },
  { code: "mariama_diop", nom: "Mariama Diop", rarete: "rare", specialite: "Soutien et soin", typeFavori: "archers",
    base: { attaque: 30, defense: 34, sante: 42, leadership: 40, vitesse: 34 },
    histoire: "Guerisseuse des armees, elle ramena plus de soldats que la mort n'en prit." },

  // Communs
  { code: "alioune_ndour", nom: "Alioune Ndour", rarete: "commun", specialite: "Infanterie", typeFavori: "infanterie",
    base: { attaque: 24, defense: 30, sante: 34, leadership: 20, vitesse: 22 },
    histoire: "Soldat de la garde du Cayor, fidele et endurant." },
  { code: "bineta_thiam", nom: "Bineta Thiam", rarete: "commun", specialite: "Archers", typeFavori: "archers",
    base: { attaque: 30, defense: 22, sante: 28, leadership: 22, vitesse: 30 },
    histoire: "Chasseuse des forets du Sud devenue archere du royaume." },
  { code: "cheikh_sy", nom: "Cheikh Sy", rarete: "commun", specialite: "Lanciers", typeFavori: "lanciers",
    base: { attaque: 26, defense: 28, sante: 32, leadership: 22, vitesse: 24 },
    histoire: "Berger du Sahel, sa lance servait d'abord contre les fauves." },
  { code: "adama_seck", nom: "Adama Seck", rarete: "commun", specialite: "Cavalerie", typeFavori: "cavalerie",
    base: { attaque: 30, defense: 20, sante: 28, leadership: 20, vitesse: 36 },
    histoire: "Messager royal, il connait chaque piste du continent." },
  { code: "rokhaya_fall", nom: "Rokhaya Fall", rarete: "commun", specialite: "Economie", typeFavori: "infanterie",
    base: { attaque: 20, defense: 26, sante: 30, leadership: 32, vitesse: 24 },
    histoire: "Marchande du Saloum, elle compte plus vite qu'elle ne parle." },
  { code: "malick_toure", nom: "Malick Toure", rarete: "commun", specialite: "Infanterie", typeFavori: "infanterie",
    base: { attaque: 26, defense: 28, sante: 32, leadership: 18, vitesse: 22 },
    histoire: "Recrue des Terres de la Savane, courageux mais encore vert." },
  { code: "sokhna_mbaye", nom: "Sokhna Mbaye", rarete: "commun", specialite: "Soutien", typeFavori: "archers",
    base: { attaque: 22, defense: 26, sante: 32, leadership: 28, vitesse: 26 },
    histoire: "Porteuse d'eau devenue indispensable a chaque campagne." }
];

const COUT_RECRUTEMENT = { argent: 400, or: 0 };
const COUT_INVOCATION_OR = 50; // invocation premium, chance accrue de rarete

function trouverHeros(code) {
  return CATALOGUE_HEROS.find((h) => h.code === code) || null;
}

// Tirage pondere par rarete. bonusPremium augmente les chances des raretes hautes.
function tirerHerosAleatoire(bonusPremium = false) {
  const pool = CATALOGUE_HEROS.map((heros) => {
    let poids = RARETES[heros.rarete].poidsTirage;
    if (bonusPremium && (heros.rarete === "epique" || heros.rarete === "legendaire")) {
      poids *= 3;
    }
    return { heros, poids };
  });

  const total = pool.reduce((somme, item) => somme + item.poids, 0);
  let tirage = Math.random() * total;
  for (const item of pool) {
    tirage -= item.poids;
    if (tirage <= 0) return item.heros;
  }
  return pool[0].heros;
}

// Stats reelles selon le niveau du heros (+8% par niveau au dessus de 1)
function calculerStats(codeHeros, niveau) {
  const heros = trouverHeros(codeHeros);
  if (!heros) return null;
  const multRarete = RARETES[heros.rarete].multiplicateur;
  const multNiveau = 1 + (niveau - 1) * 0.08;
  const stats = {};
  for (const [cle, valeur] of Object.entries(heros.base)) {
    stats[cle] = Math.round(valeur * multRarete * multNiveau);
  }
  stats.puissance = Math.round(
    stats.attaque * 2 + stats.defense * 2 + stats.sante + stats.leadership * 1.5
  );
  return stats;
}

module.exports = {
  RARETES,
  CATALOGUE_HEROS,
  COUT_RECRUTEMENT,
  COUT_INVOCATION_OR,
  trouverHeros,
  tirerHerosAleatoire,
  calculerStats
};
