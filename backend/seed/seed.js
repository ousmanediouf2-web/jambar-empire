require("dotenv").config();
const mongoose = require("mongoose");
const Region = require("../models/Region");
const CountryCity = require("../models/CountryCity");
const Tile = require("../models/Tile");
const CampCarte = require("../models/CampCarte");
const { CAMPS_ENNEMIS } = require("../config/campsEnnemis");
const regionsData = require("./regionsData");

// Ponderation du terrain par region (doit sommer a peu pres a 1)
// vide = terrain constructible, les autres sont des cases de recolte
const PONDERATION_TERRAIN = {
  Dakar:        { vide: 0.55, prairie: 0.20, colline: 0.15, foret: 0.05, lac: 0.05, montagne: 0.00 },
  Thies:        { vide: 0.40, colline: 0.25, prairie: 0.20, foret: 0.10, lac: 0.05, montagne: 0.00 },
  Diourbel:     { vide: 0.40, prairie: 0.35, colline: 0.10, foret: 0.10, lac: 0.05, montagne: 0.00 },
  "Saint-Louis":{ vide: 0.35, lac: 0.30, prairie: 0.25, foret: 0.05, colline: 0.05, montagne: 0.00 },
  Louga:        { vide: 0.40, prairie: 0.35, colline: 0.15, foret: 0.05, lac: 0.05, montagne: 0.00 },
  Matam:        { vide: 0.35, lac: 0.25, prairie: 0.30, foret: 0.05, colline: 0.05, montagne: 0.00 },
  Fatick:       { vide: 0.35, lac: 0.30, prairie: 0.20, foret: 0.10, colline: 0.05, montagne: 0.00 },
  Kaolack:      { vide: 0.40, prairie: 0.30, lac: 0.15, colline: 0.10, foret: 0.05, montagne: 0.00 },
  Kaffrine:     { vide: 0.40, prairie: 0.40, colline: 0.10, foret: 0.05, lac: 0.05, montagne: 0.00 },
  Tambacounda:  { vide: 0.35, prairie: 0.30, foret: 0.20, colline: 0.10, lac: 0.05, montagne: 0.00 },
  Kedougou:     { vide: 0.30, montagne: 0.30, foret: 0.20, colline: 0.15, prairie: 0.05, lac: 0.00 },
  Kolda:        { vide: 0.35, foret: 0.30, prairie: 0.20, colline: 0.10, lac: 0.05, montagne: 0.00 },
  Sedhiou:      { vide: 0.30, foret: 0.40, prairie: 0.15, colline: 0.10, lac: 0.05, montagne: 0.00 },
  Ziguinchor:   { vide: 0.30, foret: 0.35, lac: 0.20, prairie: 0.10, colline: 0.05, montagne: 0.00 },
  Gambie:       { vide: 0.35, lac: 0.30, foret: 0.20, prairie: 0.10, colline: 0.05, montagne: 0.00 }
};

const RESSOURCE_PAR_TERRAIN = {
  foret: "bois",
  prairie: "ble",
  lac: "ble",
  montagne: "fer",
  colline: "pierre",
  vide: null
};

const LARGEUR_CARTE = 1200;
const HAUTEUR_CARTE = 800;
const TAILLE_CASE = 20; // une case tous les 20 unites -> grille de 60 x 40

// Contour approximatif de la Senegambie (silhouette organique, pas un
// rectangle). Coordonnees dans le meme repere que les regions.
const CONTOUR_SENEGAMBIE = [
  [180, 20], [400, 15], [700, 40], [850, 150], [950, 350],
  [900, 500], [600, 540], [400, 500], [200, 520], [100, 480],
  [40, 400], [20, 300], [60, 180]
];

function estDansLeContour(x, y, polygone) {
  let dedans = false;
  for (let i = 0, j = polygone.length - 1; i < polygone.length; j = i++) {
    const [xi, yi] = polygone[i];
    const [xj, yj] = polygone[j];
    const intersecte =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersecte) dedans = !dedans;
  }
  return dedans;
}

function tirerTerrain(ponderation) {
  const r = Math.random();
  let cumul = 0;
  for (const [terrain, poids] of Object.entries(ponderation)) {
    cumul += poids;
    if (r <= cumul) return terrain;
  }
  return "vide";
}

function trouverRegionLaPlusProche(x, y, regionsCreees) {
  let meilleure = null;
  let meilleureDistance = Infinity;
  for (const region of regionsCreees) {
    const dx = region.coordonnees.x - x;
    const dy = region.coordonnees.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < meilleureDistance) {
      meilleureDistance = distance;
      meilleure = region;
    }
  }
  return meilleure;
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connecte, demarrage du seed...");

  console.log("Nettoyage des collections existantes...");
  await Region.deleteMany({});
  await CountryCity.deleteMany({});
  await Tile.deleteMany({});
  await CampCarte.deleteMany({});

  console.log("Creation des 15 regions et de leurs departements...");
  const regionsCreees = [];
  for (const data of regionsData) {
    const region = await Region.create({
      nom: data.nom,
      estCapitale: data.estCapitale,
      bonusRessource: data.bonusRessource,
      coordonnees: data.coordonnees,
      tauxImposition: 0
    });

    const countryCities = [];
    for (const nomCC of data.countryCities) {
      const cc = await CountryCity.create({
        nom: nomCC,
        region: region._id,
        coordonnees: {
          x: data.coordonnees.x + (Math.random() * 40 - 20),
          y: data.coordonnees.y + (Math.random() * 40 - 20)
        }
      });
      countryCities.push(cc);
    }

    region.countryCities = countryCities.map((cc) => cc._id);
    await region.save();

    regionsCreees.push({
      _id: region._id,
      nom: region.nom,
      coordonnees: region.coordonnees,
      countryCities
    });
  }
  console.log(`${regionsCreees.length} regions creees.`);

  console.log("Generation de la grille de terrain (peut prendre un moment)...");
  const nbColonnes = LARGEUR_CARTE / TAILLE_CASE;
  const nbLignes = HAUTEUR_CARTE / TAILLE_CASE;

  // Etape 1 : tirage brut du terrain, uniquement pour les cases a l'interieur
  // du contour de la Senegambie (sinon la carte reste un rectangle plein).
  let grille = Array.from({ length: nbColonnes }, () => new Array(nbLignes).fill(null));

  for (let col = 0; col < nbColonnes; col++) {
    for (let ligne = 0; ligne < nbLignes; ligne++) {
      const x = col * TAILLE_CASE;
      const y = ligne * TAILLE_CASE;

      if (!estDansLeContour(x, y, CONTOUR_SENEGAMBIE)) continue;

      const regionProche = trouverRegionLaPlusProche(x, y, regionsCreees);
      const ponderation = PONDERATION_TERRAIN[regionProche.nom] || PONDERATION_TERRAIN.Dakar;
      grille[col][ligne] = { terrain: tirerTerrain(ponderation), region: regionProche };
    }
  }

  // Etape 2 : lissage par vote majoritaire des voisins, pour regrouper le
  // terrain en zones (foret, desert...) plutot que des cases isolees au
  // hasard. La case elle-meme compte 3 fois plus que chaque voisin, pour
  // eviter d'effacer completement les petites zones.
  function lisserGrille(grilleActuelle) {
    const nouvelleGrille = Array.from({ length: nbColonnes }, () => new Array(nbLignes).fill(null));

    for (let col = 0; col < nbColonnes; col++) {
      for (let ligne = 0; ligne < nbLignes; ligne++) {
        const caseActuelle = grilleActuelle[col][ligne];
        if (!caseActuelle) continue;

        const comptage = {};
        function ajouter(terrain, poids) {
          comptage[terrain] = (comptage[terrain] || 0) + poids;
        }
        ajouter(caseActuelle.terrain, 3);

        for (let dCol = -1; dCol <= 1; dCol++) {
          for (let dLigne = -1; dLigne <= 1; dLigne++) {
            if (dCol === 0 && dLigne === 0) continue;
            const voisin = grilleActuelle[col + dCol]?.[ligne + dLigne];
            if (voisin) ajouter(voisin.terrain, 1);
          }
        }

        let terrainMajoritaire = caseActuelle.terrain;
        let meilleurScore = -1;
        for (const [terrain, score] of Object.entries(comptage)) {
          if (score > meilleurScore) {
            meilleurScore = score;
            terrainMajoritaire = terrain;
          }
        }

        nouvelleGrille[col][ligne] = { terrain: terrainMajoritaire, region: caseActuelle.region };
      }
    }
    return nouvelleGrille;
  }

  grille = lisserGrille(grille);

  // Etape 3 : conversion de la grille en tiles a inserer en base.
  const tilesAInserer = [];
  for (let col = 0; col < nbColonnes; col++) {
    for (let ligne = 0; ligne < nbLignes; ligne++) {
      const caseActuelle = grille[col][ligne];
      if (!caseActuelle) continue;

      const ccAleatoire =
        caseActuelle.region.countryCities[
          Math.floor(Math.random() * caseActuelle.region.countryCities.length)
        ];

      tilesAInserer.push({
        x: col * TAILLE_CASE,
        y: ligne * TAILLE_CASE,
        countryCity: ccAleatoire._id,
        typeTerrain: caseActuelle.terrain,
        ressource: RESSOURCE_PAR_TERRAIN[caseActuelle.terrain]
      });
    }
  }

  await Tile.insertMany(tilesAInserer);
  console.log(`${tilesAInserer.length} tiles generees sur une grille ${nbColonnes}x${nbLignes}.`);

  const nbVides = tilesAInserer.filter((t) => t.typeTerrain === "vide").length;
  console.log(`dont ${nbVides} cases vides disponibles pour la construction de villes.`);

  // --- Camps ennemis poses sur la carte ---
  console.log("Placement des camps ennemis...");
  const casesLibres = tilesAInserer.filter((t) => t.typeTerrain !== "vide");
  const campsAInserer = [];
  const NB_CAMPS_PAR_NIVEAU = { 1: 40, 2: 30, 3: 22, 4: 15, 5: 10, 6: 6, 7: 3 };

  const dejaPris = new Set();
  for (const camp of CAMPS_ENNEMIS) {
    const nombre = NB_CAMPS_PAR_NIVEAU[camp.niveau] || 5;
    let poses = 0;
    let essais = 0;
    while (poses < nombre && essais < nombre * 50) {
      essais++;
      const t = casesLibres[Math.floor(Math.random() * casesLibres.length)];
      if (!t) break;
      const cle = `${t.x},${t.y}`;
      if (dejaPris.has(cle)) continue;
      dejaPris.add(cle);
      campsAInserer.push({ niveau: camp.niveau, x: t.x, y: t.y });
      poses++;
    }
  }
  await CampCarte.insertMany(campsAInserer);
  console.log(`${campsAInserer.length} camps ennemis places sur le continent.`);

  console.log("Seed termine avec succes.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Erreur pendant le seed :", err);
  process.exit(1);
});
