// Correspondance entre les codes du jeu et les fichiers de sprites.
//
// Les batiments saheliens sont dans /sprites/sahel/b01.png ... b33.png
// Pour changer l'image d'un batiment, il suffit de modifier son numero ici.

const SPRITES_BATIMENTS = {
  // --- Interieur de la cite ---
  palais_royal:    "/sprites/sahel/b05.png",
  muraille:        "/sprites/sahel/b22.png",
  caserne:         "/sprites/sahel/b03.png",
  camp_lanciers:   "/sprites/sahel/b07.png",
  terrain_archers: "/sprites/sahel/b30.png",
  ecurie:          "/sprites/sahel/b26.png",
  atelier_siege:   "/sprites/sahel/b18.png",
  forge:           "/sprites/sahel/b21.png",
  tour_garde:      "/sprites/sahel/b28.png",
  hopital:         "/sprites/sahel/b12.png",
  academie:        "/sprites/sahel/b16.png",
  marche:          "/sprites/sahel/b17.png",
  entrepot:        "/sprites/sahel/b24.png",
  ambassade:       "/sprites/sahel/b09.png",
  taverne:         "/sprites/sahel/b23.png",
  temple:          "/sprites/sahel/b08.png",
  place_royale:    "/sprites/sahel/b11.png",
  hotel_monnaies:  "/sprites/sahel/b06.png",
  habitation:      "/sprites/sahel/b29.png",
  conseil_royal:   "/sprites/sahel/b03.png",
  atelier_beliers: "/sprites/sahel/b13.png",
  maison_eclaireurs: "/sprites/sahel/b10.png",
  caravane_royale: "/sprites/sahel/b19.png",
  palais_heros:    "/sprites/sahel/b14.png",
  salle_commandants: "/sprites/sahel/b15.png",
  maison_alliance: "/sprites/sahel/b20.png",
  tours_archers:   "/sprites/sahel/b27.png",
  bastion_royal:   "/sprites/sahel/b32.png",
  porte_fortifiee: "/sprites/sahel/b33.png",
  monument_jambar: "/sprites/sahel/b25.png",

  // --- Exterieur : les champs ---
  ferme:    "/sprites/batiments/ferme.png",
  scierie:  "/sprites/batiments/scierie.png",
  carriere: "/sprites/batiments/carriere.png",
  mine:     "/sprites/batiments/mine.png"
};

// Affiche pendant les travaux, quel que soit le batiment
export const SPRITE_CHANTIER = "/sprites/sahel/b01.png";

const SPRITES_TROUPES = {
  ouvrier: "/sprites/troupes/ouvrier.png",
  milicien: "/sprites/troupes/milicien.png",
  eclaireur: "/sprites/troupes/eclaireur.png",
  lanciers: "/sprites/troupes/lanciers.png",
  infanterie: "/sprites/troupes/infanterie.png",
  archers: "/sprites/troupes/archers.png",
  cavalerie: "/sprites/troupes/cavalerie.png",
  cavalerie_lourde: "/sprites/troupes/cavalerie_lourde.png",
  transporteur: "/sprites/troupes/transporteur.png",
  baliste: "/sprites/troupes/baliste.png",
  belier: "/sprites/troupes/belier.png",
  catapulte: "/sprites/troupes/catapulte.png"
};

const PORTRAITS_HEROS = ["/sprites/heros/heros_1.png", "/sprites/heros/heros_2.png"];

export function spriteTroupe(code) {
  return SPRITES_TROUPES[code] || null;
}

export function spriteBatiment(code) {
  return SPRITES_BATIMENTS[code] || null;
}

// Conserve pour compatibilite : plus de vignettes rectangulaires
export function vignetteBatiment() {
  return null;
}

export function portraitHeros(codeHeros) {
  if (!codeHeros) return PORTRAITS_HEROS[0];
  let somme = 0;
  for (let i = 0; i < codeHeros.length; i++) somme += codeHeros.charCodeAt(i);
  return PORTRAITS_HEROS[somme % PORTRAITS_HEROS.length];
}
