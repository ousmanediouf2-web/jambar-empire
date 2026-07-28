const express = require("express");
const Alliance = require("../models/Alliance");
const MessageAlliance = require("../models/MessageAlliance");
const Joueur = require("../models/Joueur");
const Ville = require("../models/Ville");
const MouvementRessource = require("../models/MouvementRessource");
const { rafraichirVille } = require("../services/production");
const { membresAllianceMax } = require("../config/batiments");

const router = express.Router();

const RANGS = ["roi", "general", "commandant", "officier", "membre"];
const COUT_CREATION = { argent: 2000, bois: 1000, pierre: 1000 };
const RESSOURCES_DONNABLES = ["ble", "bois", "pierre", "fer", "argent"];

function rangDuJoueur(alliance, joueurId) {
  const membre = alliance.membres.find((m) => String(m.joueur?._id || m.joueur) === String(joueurId));
  return membre?.rang || null;
}

// Un rang peut agir sur un autre s'il est strictement plus haut dans la hierarchie
function peutAgirSur(rangActeur, rangCible) {
  if (!rangActeur || !rangCible) return false;
  return RANGS.indexOf(rangActeur) < RANGS.indexOf(rangCible);
}

function estOfficier(rang) {
  return rang && RANGS.indexOf(rang) <= RANGS.indexOf("officier");
}

async function messageSysteme(allianceId, contenu) {
  await MessageAlliance.create({
    alliance: allianceId,
    nomAuteur: "Systeme",
    contenu,
    systeme: true
  });
}

// Liste des alliances (annuaire)
router.get("/", async (req, res) => {
  const alliances = await Alliance.find()
    .select("nom tag description membres membresMax adhesionLibre prestigeMinimum dateCreation")
    .lean();

  res.json(
    alliances.map((a) => ({
      _id: a._id,
      nom: a.nom,
      tag: a.tag,
      description: a.description,
      nbMembres: a.membres.length,
      membresMax: a.membresMax,
      adhesionLibre: a.adhesionLibre,
      prestigeMinimum: a.prestigeMinimum,
      dateCreation: a.dateCreation
    }))
  );
});

// Mon alliance (details complets)
router.get("/mienne", async (req, res) => {
  const joueur = await Joueur.findById(req.user._id).select("alliance pointsPrestige");
  if (!joueur.alliance) return res.json({ alliance: null, coutCreation: COUT_CREATION });

  const alliance = await Alliance.findById(joueur.alliance)
    .populate("membres.joueur", "nom rang pointsPrestige derniereConnexion")
    .lean();

  if (!alliance) return res.json({ alliance: null, coutCreation: COUT_CREATION });

  const monRang = rangDuJoueur(alliance, req.user._id);

  const messages = await MessageAlliance.find({ alliance: alliance._id })
    .sort({ dateCreation: -1 })
    .limit(50)
    .lean();

  res.json({
    alliance,
    monRang,
    rangs: RANGS,
    messages: messages.reverse(),
    ressourcesDonnables: RESSOURCES_DONNABLES
  });
});

// Creer une alliance
router.post("/creer", async (req, res) => {
  try {
    const { nom, tag, description } = req.body || {};
    if (!nom || !tag) return res.status(400).json({ erreur: "Nom et tag obligatoires" });
    if (String(tag).length > 5) return res.status(400).json({ erreur: "Le tag fait 5 caracteres maximum" });

    const joueur = await Joueur.findById(req.user._id);
    if (joueur.alliance) return res.status(400).json({ erreur: "Tu appartiens deja a une alliance" });

    const existe = await Alliance.findOne({ $or: [{ nom }, { tag: String(tag).toUpperCase() }] });
    if (existe) return res.status(400).json({ erreur: "Ce nom ou ce tag est deja pris" });

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    for (const [ressource, quantite] of Object.entries(COUT_CREATION)) {
      if ((ville.ressources[ressource] ?? 0) < quantite) {
        return res.status(400).json({ erreur: "Ressources insuffisantes", coutRequis: COUT_CREATION });
      }
    }

    for (const [ressource, quantite] of Object.entries(COUT_CREATION)) {
      ville.ressources[ressource] -= quantite;
      await MouvementRessource.create({
        joueur: req.user._id,
        type: ressource,
        quantite: -quantite,
        origine: "transfert_alliance",
        soldeApres: ville.ressources[ressource]
      });
    }
    await ville.save();

    const niveauAmbassade = ville.batiments?.find((b) => b.type === "ambassade")?.niveau ?? 0;
    if (niveauAmbassade < 1) {
      return res.status(400).json({ erreur: "Construis une Ambassade pour fonder une alliance" });
    }

    const alliance = await Alliance.create({
      nom,
      tag: String(tag).toUpperCase(),
      description: description || "",
      chef: joueur._id,
      membresMax: membresAllianceMax(niveauAmbassade),
      membres: [{ joueur: joueur._id, rang: "roi" }]
    });

    joueur.alliance = alliance._id;
    await joueur.save();

    await messageSysteme(alliance._id, `${joueur.nom} a fonde l'alliance ${alliance.nom}.`);

    res.status(201).json({ alliance });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Rejoindre une alliance
router.post("/:id/rejoindre", async (req, res) => {
  try {
    const joueur = await Joueur.findById(req.user._id);
    if (joueur.alliance) return res.status(400).json({ erreur: "Tu appartiens deja a une alliance" });

    const alliance = await Alliance.findById(req.params.id);
    if (!alliance) return res.status(404).json({ erreur: "Alliance introuvable" });
    if (!alliance.adhesionLibre) {
      return res.status(400).json({ erreur: "Cette alliance ne recrute pas librement" });
    }
    if (alliance.membres.length >= alliance.membresMax) {
      return res.status(400).json({ erreur: "Cette alliance est complete" });
    }
    if ((joueur.pointsPrestige || 0) < alliance.prestigeMinimum) {
      return res.status(400).json({
        erreur: `Il faut au moins ${alliance.prestigeMinimum} points de prestige pour rejoindre`
      });
    }

    alliance.membres.push({ joueur: joueur._id, rang: "membre" });
    await alliance.save();

    joueur.alliance = alliance._id;
    await joueur.save();

    await messageSysteme(alliance._id, `${joueur.nom} a rejoint l'alliance.`);

    res.json({ message: `Tu as rejoint ${alliance.nom}` });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Quitter son alliance
router.post("/quitter", async (req, res) => {
  try {
    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const alliance = await Alliance.findById(joueur.alliance);
    if (!alliance) {
      joueur.alliance = null;
      await joueur.save();
      return res.json({ message: "Alliance introuvable, tu en es detache" });
    }

    const monRang = rangDuJoueur(alliance, joueur._id);

    if (monRang === "roi" && alliance.membres.length > 1) {
      return res.status(400).json({
        erreur: "Transmets d'abord la couronne a un autre membre avant de quitter l'alliance"
      });
    }

    alliance.membres = alliance.membres.filter(
      (m) => String(m.joueur) !== String(joueur._id)
    );

    if (alliance.membres.length === 0) {
      await MessageAlliance.deleteMany({ alliance: alliance._id });
      await Alliance.findByIdAndDelete(alliance._id);
    } else {
      await alliance.save();
      await messageSysteme(alliance._id, `${joueur.nom} a quitte l'alliance.`);
    }

    joueur.alliance = null;
    await joueur.save();

    res.json({ message: "Tu as quitte l'alliance" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Faire un don au coffre de l'alliance
router.post("/donner", async (req, res) => {
  try {
    const { ressource, quantite } = req.body || {};
    if (!RESSOURCES_DONNABLES.includes(ressource)) {
      return res.status(400).json({ erreur: "Ressource non donnable" });
    }
    const montant = Number(quantite);
    if (!Number.isInteger(montant) || montant <= 0) {
      return res.status(400).json({ erreur: "Quantite invalide" });
    }

    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });
    await rafraichirVille(ville);

    if ((ville.ressources[ressource] ?? 0) < montant) {
      return res.status(400).json({ erreur: "Ressources insuffisantes" });
    }

    ville.ressources[ressource] -= montant;
    await ville.save();

    await MouvementRessource.create({
      joueur: joueur._id,
      type: ressource,
      quantite: -montant,
      origine: "transfert_alliance",
      soldeApres: ville.ressources[ressource]
    });

    const alliance = await Alliance.findById(joueur.alliance);
    alliance.coffre[ressource] = (alliance.coffre[ressource] || 0) + montant;

    const membre = alliance.membres.find((m) => String(m.joueur) === String(joueur._id));
    if (membre) membre.contribution += montant;

    await alliance.save();

    res.json({ message: `Don de ${montant} ${ressource} au coffre`, coffre: alliance.coffre, ressources: ville.ressources });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Changer le rang d'un membre (promotion / retrogradation)
router.post("/membre/:joueurId/rang", async (req, res) => {
  try {
    const { rang } = req.body || {};
    if (!RANGS.includes(rang)) return res.status(400).json({ erreur: "Rang inconnu" });

    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const alliance = await Alliance.findById(joueur.alliance);
    const monRang = rangDuJoueur(alliance, joueur._id);
    if (!estOfficier(monRang)) {
      return res.status(403).json({ erreur: "Ton rang ne permet pas cette action" });
    }

    const membre = alliance.membres.find((m) => String(m.joueur) === String(req.params.joueurId));
    if (!membre) return res.status(404).json({ erreur: "Membre introuvable" });

    if (!peutAgirSur(monRang, membre.rang)) {
      return res.status(403).json({ erreur: "Tu ne peux pas modifier un membre de rang egal ou superieur" });
    }
    if (rang === "roi") {
      if (monRang !== "roi") {
        return res.status(403).json({ erreur: "Seul le roi peut transmettre la couronne" });
      }
      // Transmission de la couronne
      const ancienRoi = alliance.membres.find((m) => String(m.joueur) === String(joueur._id));
      if (ancienRoi) ancienRoi.rang = "general";
      alliance.chef = membre.joueur;
    }
    if (RANGS.indexOf(rang) <= RANGS.indexOf(monRang) && rang !== "roi") {
      return res.status(403).json({ erreur: "Tu ne peux pas nommer un rang egal ou superieur au tien" });
    }

    membre.rang = rang;
    await alliance.save();

    const cible = await Joueur.findById(req.params.joueurId).select("nom");
    await messageSysteme(alliance._id, `${cible?.nom || "Un membre"} est desormais ${rang}.`);

    res.json({ message: "Rang mis a jour" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Exclure un membre
router.post("/membre/:joueurId/exclure", async (req, res) => {
  try {
    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const alliance = await Alliance.findById(joueur.alliance);
    const monRang = rangDuJoueur(alliance, joueur._id);
    if (!estOfficier(monRang)) {
      return res.status(403).json({ erreur: "Ton rang ne permet pas cette action" });
    }

    const membre = alliance.membres.find((m) => String(m.joueur) === String(req.params.joueurId));
    if (!membre) return res.status(404).json({ erreur: "Membre introuvable" });
    if (!peutAgirSur(monRang, membre.rang)) {
      return res.status(403).json({ erreur: "Tu ne peux pas exclure ce membre" });
    }

    alliance.membres = alliance.membres.filter(
      (m) => String(m.joueur) !== String(req.params.joueurId)
    );
    await alliance.save();

    await Joueur.findByIdAndUpdate(req.params.joueurId, { alliance: null });

    const cible = await Joueur.findById(req.params.joueurId).select("nom");
    await messageSysteme(alliance._id, `${cible?.nom || "Un membre"} a ete exclu de l'alliance.`);

    res.json({ message: "Membre exclu" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Chat d'alliance
router.post("/message", async (req, res) => {
  try {
    const contenu = String(req.body?.contenu || "").trim();
    if (!contenu) return res.status(400).json({ erreur: "Message vide" });
    if (contenu.length > 500) return res.status(400).json({ erreur: "Message trop long (500 caracteres max)" });

    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const message = await MessageAlliance.create({
      alliance: joueur.alliance,
      auteur: joueur._id,
      nomAuteur: joueur.nom,
      contenu
    });

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Modifier les parametres de l'alliance (roi et general seulement)
router.put("/parametres", async (req, res) => {
  try {
    const joueur = await Joueur.findById(req.user._id);
    if (!joueur.alliance) return res.status(400).json({ erreur: "Tu n'es dans aucune alliance" });

    const alliance = await Alliance.findById(joueur.alliance);
    const monRang = rangDuJoueur(alliance, joueur._id);
    if (!["roi", "general"].includes(monRang)) {
      return res.status(403).json({ erreur: "Seuls le roi et les generaux peuvent modifier l'alliance" });
    }

    const { description, adhesionLibre, prestigeMinimum } = req.body || {};
    if (description !== undefined) alliance.description = String(description).slice(0, 500);
    if (adhesionLibre !== undefined) alliance.adhesionLibre = Boolean(adhesionLibre);
    if (prestigeMinimum !== undefined) alliance.prestigeMinimum = Math.max(0, Number(prestigeMinimum) || 0);

    await alliance.save();
    res.json({ message: "Parametres mis a jour", alliance });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
