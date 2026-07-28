const express = require("express");
const Joueur = require("../../models/Joueur");
const Ville = require("../../models/Ville");
const ObjetInventaire = require("../../models/ObjetInventaire");
const HerosJoueur = require("../../models/HerosJoueur");
const MessagePrive = require("../../models/MessagePrive");
const MouvementRessource = require("../../models/MouvementRessource");
const LogActionAdmin = require("../../models/LogActionAdmin");
const { rafraichirVille } = require("../../services/production");
const { catalogue: catalogueObjets, trouverObjet } = require("../../config/objets");
const { CATALOGUE_HEROS, trouverHeros } = require("../../config/heros");
const { TROUPES_CONFIG } = require("../../config/troupes");

const router = express.Router();

const RESSOURCES = ["ble", "bois", "pierre", "fer", "argent", "or"];

// Ce que l'admin peut distribuer
router.get("/catalogue", (req, res) => {
  res.json({
    ressources: RESSOURCES,
    objets: catalogueObjets().map((o) => ({ code: o.code, nom: o.nom, categorie: o.categorie })),
    heros: CATALOGUE_HEROS.map((h) => ({ code: h.code, nom: h.nom, rarete: h.rarete })),
    troupes: Object.entries(TROUPES_CONFIG).map(([code, t]) => ({ code, nom: t.nom, categorie: t.categorie }))
  });
});

// Rechercher un joueur par nom
router.get("/joueurs", async (req, res) => {
  const recherche = String(req.query.q || "").trim();
  const filtre = recherche ? { nom: new RegExp(recherche, "i") } : {};
  const joueurs = await Joueur.find(filtre).select("nom rang pointsPrestige banni").limit(30).lean();
  res.json(joueurs);
});

/**
 * Offrir un lot a un joueur.
 * body: { joueurId, ressources: {ble: 1000, ...}, objets: [{code, quantite}],
 *         heros: ["sunu_diouf"], sujet, messagePersonnalise }
 */
router.post("/offrir", async (req, res) => {
  try {
    const { joueurId, ressources = {}, objets = [], heros = [], troupes = {}, sujet, messagePersonnalise } = req.body || {};

    const beneficiaire = await Joueur.findById(joueurId);
    if (!beneficiaire) return res.status(404).json({ erreur: "Joueur introuvable" });

    const ville = await Ville.findOne({ proprietaire: beneficiaire._id });
    if (!ville) return res.status(404).json({ erreur: "Ce joueur n'a pas de cite" });
    await rafraichirVille(ville);

    const recapitulatif = [];

    // --- Ressources et gemmes ---
    for (const [ressource, valeur] of Object.entries(ressources)) {
      const quantite = Number(valeur);
      if (!RESSOURCES.includes(ressource) || !Number.isFinite(quantite) || quantite === 0) continue;
      if (ville.ressources[ressource] === undefined) continue;

      ville.ressources[ressource] = Math.max(0, ville.ressources[ressource] + quantite);
      recapitulatif.push(`${quantite > 0 ? "+" : ""}${quantite} ${ressource}`);

      await MouvementRessource.create({
        joueur: beneficiaire._id,
        type: ressource,
        quantite,
        origine: "edition_admin",
        effectuePar: req.user._id,
        soldeApres: ville.ressources[ressource]
      });
    }
    await ville.save();

    // --- Objets ---
    for (const item of objets) {
      const fiche = trouverObjet(item?.code);
      const quantite = Number(item?.quantite);
      if (!fiche || !Number.isInteger(quantite) || quantite <= 0) continue;

      await ObjetInventaire.findOneAndUpdate(
        { joueur: beneficiaire._id, code: fiche.code },
        { $inc: { quantite } },
        { upsert: true, new: true }
      );
      recapitulatif.push(`${quantite}x ${fiche.nom}`);
    }

    // --- Troupes ---
    for (const [type, valeur] of Object.entries(troupes)) {
      const quantite = Number(valeur);
      if (!TROUPES_CONFIG[type] || !Number.isInteger(quantite) || quantite === 0) continue;
      ville.armee[type] = Math.max(0, (ville.armee[type] || 0) + quantite);
      recapitulatif.push(`${quantite > 0 ? "+" : ""}${quantite} ${TROUPES_CONFIG[type].nom}`);
    }
    await ville.save();

    // --- Heros ---
    for (const codeHeros of heros) {
      const fiche = trouverHeros(codeHeros);
      if (!fiche) continue;

      const existant = await HerosJoueur.findOne({ joueur: beneficiaire._id, codeHeros });
      if (existant) {
        existant.etoiles = Math.min(existant.etoiles + 1, 5);
        await existant.save();
        recapitulatif.push(`${fiche.nom} (+1 etoile)`);
      } else {
        await HerosJoueur.create({ joueur: beneficiaire._id, codeHeros, assigneA: ville._id });
        recapitulatif.push(`Heros : ${fiche.nom}`);
      }
    }

    if (recapitulatif.length === 0) {
      return res.status(400).json({ erreur: "Aucun element valide a offrir" });
    }

    // --- Message de notification ---
    const admin = await Joueur.findById(req.user._id).select("nom");
    const corps =
      (messagePersonnalise ? String(messagePersonnalise).trim() + "\n\n" : "") +
      "Tu as recu :\n" + recapitulatif.map((r) => `— ${r}`).join("\n");

    await MessagePrive.create({
      expediteur: req.user._id,
      nomExpediteur: admin?.nom || "Administration",
      destinataire: beneficiaire._id,
      nomDestinataire: beneficiaire.nom,
      sujet: String(sujet || "Un present du royaume").slice(0, 120),
      contenu: corps.slice(0, 2000)
    });

    await LogActionAdmin.create({
      admin: req.user._id,
      action: "don_joueur",
      cible: beneficiaire._id,
      apres: { ressources, objets, heros, troupes },
      ip: req.ip
    });

    res.json({
      message: `Don envoye a ${beneficiaire.nom}`,
      recapitulatif,
      ressources: ville.ressources
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Annonce a tous les joueurs
router.post("/annonce", async (req, res) => {
  try {
    const { sujet, contenu } = req.body || {};
    const texte = String(contenu || "").trim();
    if (!texte) return res.status(400).json({ erreur: "Message vide" });

    const admin = await Joueur.findById(req.user._id).select("nom");
    const joueurs = await Joueur.find({ banni: false }).select("nom").lean();

    const messages = joueurs.map((j) => ({
      expediteur: req.user._id,
      nomExpediteur: admin?.nom || "Administration",
      destinataire: j._id,
      nomDestinataire: j.nom,
      sujet: String(sujet || "Annonce du royaume").slice(0, 120),
      contenu: texte.slice(0, 2000)
    }));
    await MessagePrive.insertMany(messages);

    await LogActionAdmin.create({
      admin: req.user._id, action: "annonce_globale", ip: req.ip,
      apres: { sujet, destinataires: joueurs.length }
    });

    res.json({ message: `Annonce envoyee a ${joueurs.length} joueur(s)` });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
