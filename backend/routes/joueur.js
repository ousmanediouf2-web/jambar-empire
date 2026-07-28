const express = require("express");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const {
  BATIMENTS_CONFIG,
  CATEGORIES,
  NB_EMPLACEMENTS_INTERIEUR,
  NB_EMPLACEMENTS_EXTERIEUR,
  calculerCout,
  calculerDureeSecondes,
  batimentsDeZone
} = require("../config/batiments");
const { rafraichirVille, niveauBatiment } = require("../services/production");
const { bonusActifs } = require("../services/evenements");
const { bonusRecherches, reduction } = require("../config/recherches");

const router = express.Router();

async function finaliserAmeliorations(ville) {
  let modifie = false;
  const maintenant = new Date();
  for (const batiment of ville.batiments) {
    if (batiment.finAmelioration && batiment.finAmelioration <= maintenant) {
      batiment.niveau += 1;
      batiment.finAmelioration = null;
      modifie = true;
    }
  }
  if (modifie) await ville.save();
  return ville;
}

// Construit la vue complete de la cite : emplacements occupes et vides
function vueCite(ville) {
  function zone(nom, nbEmplacements) {
    const emplacements = [];
    for (let i = 0; i < nbEmplacements; i++) {
      const batiment = ville.batiments.find((b) => b.zone === nom && b.emplacement === i);
      if (batiment) {
        const config = BATIMENTS_CONFIG[batiment.type] || {};
        emplacements.push({
          index: i,
          vide: false,
          type: batiment.type,
          nom: config.nom || batiment.type,
          role: config.role || "",
          niveau: batiment.niveau,
          fixe: Boolean(config.fixe),
          finAmelioration: batiment.finAmelioration,
          coutProchainNiveau: calculerCout(batiment.type, batiment.niveau),
          dureeProchainNiveau: calculerDureeSecondes(batiment.type, batiment.niveau),
          niveauMax: config.niveauMax || null,
          categorie: config.categorie,
          categorieNom: CATEGORIES[config.categorie] || config.categorie
        });
      } else {
        emplacements.push({ index: i, vide: true });
      }
    }
    return emplacements;
  }

  const dejaConstruits = new Set(ville.batiments.map((b) => b.type));
  const niveauPalais = niveauBatiment(ville, "palais_royal");

  function niveauDe(code) {
    return ville.batiments.find((b) => b.type === code)?.niveau ?? 0;
  }

  function constructibles(nomZone) {
    return batimentsDeZone(nomZone).map((b) => {
      let prerequisOk = true;
      let messagePrerequis = null;
      for (const [code, niveauRequis] of Object.entries(b.prerequis || {})) {
        if (niveauDe(code) < niveauRequis) {
          prerequisOk = false;
          messagePrerequis = `${BATIMENTS_CONFIG[code]?.nom || code} niveau ${niveauRequis} requis`;
          break;
        }
      }
      return {
        code: b.code,
        nom: b.nom,
        role: b.role,
        categorie: b.categorie,
        categorieNom: CATEGORIES[b.categorie] || b.categorie,
        unique: Boolean(b.unique),
        niveauMax: b.niveauMax || null,
        dejaConstruit: Boolean(b.unique) && dejaConstruits.has(b.code),
        palaisRequis: b.palaisRequis || 1,
        palaisOk: niveauPalais >= (b.palaisRequis || 1),
        prerequisOk,
        messagePrerequis,
        cout: calculerCout(b.code, 0),
        dureeSecondes: calculerDureeSecondes(b.code, 0)
      };
    });
  }

  return {
    interieur: zone("interieur", NB_EMPLACEMENTS_INTERIEUR),
    exterieur: zone("exterieur", NB_EMPLACEMENTS_EXTERIEUR),
    constructiblesInterieur: constructibles("interieur"),
    constructiblesExterieur: constructibles("exterieur"),
    niveauPalais
  };
}

router.get("/moi", async (req, res) => {
  const joueur = await Joueur.findById(req.user._id).select("-motDePasse").populate("villes");
  const bonus = await bonusActifs();
  const bonusTech = bonusRecherches(joueur.recherches);
  let infosProduction = null;
  let cite = null;

  for (const ville of joueur.villes) {
    await finaliserAmeliorations(ville);
    const infos = await rafraichirVille(ville, bonus.multiplicateurProduction, bonusTech);
    if (!infosProduction) {
      infosProduction = infos;
      cite = vueCite(ville);
    }
  }

  res.json({
    ...joueur.toObject(),
    production: infosProduction,
    evenements: bonus,
    bonusRecherche: bonusTech,
    cite
  });
});

// Construire un nouveau batiment sur un emplacement vide
router.post("/ville/:villeId/construire", async (req, res) => {
  try {
    const { type, zone, emplacement } = req.body || {};
    const config = BATIMENTS_CONFIG[type];
    if (!config) return res.status(400).json({ erreur: "Type de batiment inconnu" });
    if (config.fixe) return res.status(400).json({ erreur: "Ce batiment existe deja des la fondation" });
    if (config.zone !== zone) {
      return res.status(400).json({ erreur: `${config.nom} se construit en zone ${config.zone}` });
    }

    const maxEmplacements = zone === "exterieur" ? NB_EMPLACEMENTS_EXTERIEUR : NB_EMPLACEMENTS_INTERIEUR;
    const index = Number(emplacement);
    if (!Number.isInteger(index) || index < 0 || index >= maxEmplacements) {
      return res.status(400).json({ erreur: "Emplacement invalide" });
    }

    const ville = await Ville.findOne({ _id: req.params.villeId, proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Ville introuvable" });

    await finaliserAmeliorations(ville);
    await rafraichirVille(ville);

    const occupe = ville.batiments.find((b) => b.zone === zone && b.emplacement === index);
    if (occupe) return res.status(400).json({ erreur: "Cet emplacement est deja occupe" });

    const existant = ville.batiments.find((b) => b.type === type);
    if (config.unique && existant) {
      return res.status(400).json({
        erreur: `Tu possedes deja ${config.nom} (niveau ${existant.niveau}, parcelle ${existant.emplacement + 1} de la zone ${existant.zone}). Clique dessus pour l'ameliorer, ou demolis-la pour liberer la place.`
      });
    }

    const niveauPalais = niveauBatiment(ville, "palais_royal");
    if (niveauPalais < (config.palaisRequis || 1)) {
      return res.status(400).json({
        erreur: `Ton Palais Royal doit etre au niveau ${config.palaisRequis || 1} pour construire ${config.nom}`
      });
    }

    for (const [codeRequis, niveauRequis] of Object.entries(config.prerequis || {})) {
      const actuel = niveauBatiment(ville, codeRequis);
      if (actuel < niveauRequis) {
        return res.status(400).json({
          erreur: `${config.nom} exige ${BATIMENTS_CONFIG[codeRequis]?.nom || codeRequis} au niveau ${niveauRequis} (actuellement ${actuel})`
        });
      }
    }

    const joueurComplet = await Joueur.findById(req.user._id).select("recherches");
    const bonusTech = bonusRecherches(joueurComplet?.recherches);
    const reductionCout = reduction(bonusTech, "cout_construction");
    const reductionDuree = reduction(bonusTech, "vitesse_construction");

    const coutBrut = calculerCout(type, 0);
    const cout = {};
    for (const [ressource, quantite] of Object.entries(coutBrut)) {
      cout[ressource] = Math.round(quantite * reductionCout);
    }

    for (const [ressource, quantite] of Object.entries(cout)) {
      if ((ville.ressources[ressource] ?? 0) < quantite) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: cout });
      }
    }

    for (const [ressource, quantite] of Object.entries(cout)) {
      ville.ressources[ressource] -= quantite;
      await MouvementRessource.create({
        joueur: req.user._id,
        type: ressource,
        quantite: -quantite,
        origine: "construction",
        soldeApres: ville.ressources[ressource]
      });
    }

    const duree = Math.max(1, Math.round(calculerDureeSecondes(type, 0) * reductionDuree));

    ville.batiments.push({
      type,
      zone,
      emplacement: index,
      niveau: 0,
      finAmelioration: new Date(Date.now() + duree * 1000)
    });
    await ville.save();

    res.status(201).json({
      message: `Construction de ${config.nom} lancee`,
      cite: vueCite(ville),
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Ameliorer un batiment existant
router.post("/ville/:villeId/batiments/:type/ameliorer", async (req, res) => {
  try {
    const config = BATIMENTS_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ erreur: "Type de batiment inconnu" });

    const ville = await Ville.findOne({ _id: req.params.villeId, proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Ville introuvable" });

    await finaliserAmeliorations(ville);
    await rafraichirVille(ville);

    const batiment = ville.batiments.find((b) => b.type === req.params.type);
    if (!batiment) return res.status(404).json({ erreur: "Ce batiment n'est pas construit" });
    if (batiment.finAmelioration) {
      return res.status(400).json({ erreur: "Des travaux sont deja en cours sur ce batiment" });
    }

    const niveauCible = batiment.niveau + 1;

    if (config.niveauMax && niveauCible > config.niveauMax) {
      return res.status(400).json({ erreur: `${config.nom} a atteint son niveau maximum (${config.niveauMax})` });
    }

    if (req.params.type === "palais_royal") {
      // Le Palais n'est limite que par son propre niveau maximum
    } else {
      const niveauPalais = niveauBatiment(ville, "palais_royal");
      if (niveauCible > niveauPalais) {
        return res.status(400).json({
          erreur: `${config.nom} ne peut pas depasser le niveau du Palais Royal (actuellement ${niveauPalais}). Ameliore d'abord ton Palais.`
        });
      }
    }

    const joueurComplet = await Joueur.findById(req.user._id).select("recherches");
    const bonusTech = bonusRecherches(joueurComplet?.recherches);
    const reductionCout = reduction(bonusTech, "cout_construction");
    const reductionDuree = reduction(bonusTech, "vitesse_construction");

    const coutBrut = calculerCout(req.params.type, batiment.niveau);
    const cout = {};
    for (const [ressource, quantite] of Object.entries(coutBrut)) {
      cout[ressource] = Math.round(quantite * reductionCout);
    }

    for (const [ressource, quantite] of Object.entries(cout)) {
      if ((ville.ressources[ressource] ?? 0) < quantite) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: cout, ressourcesActuelles: ville.ressources });
      }
    }

    for (const [ressource, quantite] of Object.entries(cout)) {
      ville.ressources[ressource] -= quantite;
      await MouvementRessource.create({
        joueur: req.user._id,
        type: ressource,
        quantite: -quantite,
        origine: "construction",
        soldeApres: ville.ressources[ressource]
      });
    }

    const dureeSecondes = Math.max(1, Math.round(
      calculerDureeSecondes(req.params.type, batiment.niveau) * reductionDuree
    ));
    batiment.finAmelioration = new Date(Date.now() + dureeSecondes * 1000);
    await ville.save();

    res.json({
      message: `Amelioration de ${config.nom} lancee`,
      cite: vueCite(ville),
      finAmelioration: batiment.finAmelioration
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Demolir un batiment (rend la moitie des ressources investies)
router.delete("/ville/:villeId/batiments/:type", async (req, res) => {
  try {
    const config = BATIMENTS_CONFIG[req.params.type];
    if (!config) return res.status(400).json({ erreur: "Type de batiment inconnu" });
    if (config.fixe) return res.status(400).json({ erreur: "Ce batiment ne peut pas etre demoli" });

    const ville = await Ville.findOne({ _id: req.params.villeId, proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Ville introuvable" });

    await finaliserAmeliorations(ville);
    await rafraichirVille(ville);

    const index = ville.batiments.findIndex((b) => b.type === req.params.type);
    if (index === -1) return res.status(404).json({ erreur: "Ce batiment n'est pas construit" });

    const batiment = ville.batiments[index];
    for (let niveau = 0; niveau < batiment.niveau; niveau++) {
      const cout = calculerCout(req.params.type, niveau);
      for (const [ressource, quantite] of Object.entries(cout)) {
        ville.ressources[ressource] = (ville.ressources[ressource] || 0) + Math.round(quantite / 2);
      }
    }

    ville.batiments.splice(index, 1);
    await ville.save();

    res.json({ message: `${config.nom} demoli`, cite: vueCite(ville), ressources: ville.ressources });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
