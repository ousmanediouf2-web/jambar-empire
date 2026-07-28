const express = require("express");
const Ville = require("../models/Ville");
const Joueur = require("../models/Joueur");
const HerosJoueur = require("../models/HerosJoueur");
const RapportBataille = require("../models/RapportBataille");
const MouvementRessource = require("../models/MouvementRessource");
const { CAMPS_ENNEMIS, trouverCamp } = require("../config/campsEnnemis");
const CampCarte = require("../models/CampCarte");
const { resoudreBataille } = require("../config/combat");
const { TROUPES_CONFIG, palierMax } = require("../config/troupes");
const { trouverHeros } = require("../config/heros");
const { rafraichirVille } = require("../services/production");
const { tauxSoin, bonusPrestige } = require("../config/batiments");
const { bonusActifs } = require("../services/evenements");
const { bonusRecherches } = require("../config/recherches");
const ObjetJoueur = require("../models/ObjetJoueur");
const { bonusEquipement } = require("../config/equipements");

const router = express.Router();

function niveauBatiment(ville, type) {
  return ville.batiments?.find((b) => b.type === type)?.niveau ?? 0;
}

// Liste des camps attaquables
router.get("/camps", async (req, res) => {
  res.json(
    CAMPS_ENNEMIS.map((c) => ({
      niveau: c.niveau,
      nom: c.nom,
      description: c.description,
      armee: c.armee,
      butin: c.butin,
      experience: c.experience,
      bonusMuraille: c.bonusMuraille || 1
    }))
  );
});

// Historique des rapports du joueur
router.get("/rapports", async (req, res) => {
  const rapports = await RapportBataille.find({ joueur: req.user._id })
    .sort({ dateCreation: -1 })
    .limit(30)
    .lean();
  res.json(rapports);
});

// Attaquer un camp ennemi
router.post("/attaquer-camp", async (req, res) => {
  try {
    const { niveauCamp, troupes, herosId, campCarteId } = req.body || {};

    // Attaque d'un camp pose sur la carte, ou d'un camp generique par son niveau
    let campSurCarte = null;
    let niveau = niveauCamp;
    if (campCarteId) {
      campSurCarte = await CampCarte.findById(campCarteId);
      if (!campSurCarte) return res.status(404).json({ erreur: "Ce camp n'existe plus" });
      if (campSurCarte.reapparitionLe && campSurCarte.reapparitionLe > new Date()) {
        return res.status(400).json({ erreur: "Ce camp a deja ete detruit, il se reforme" });
      }
      niveau = campSurCarte.niveau;
    }

    const camp = trouverCamp(niveau);
    if (!camp) return res.status(400).json({ erreur: "Camp introuvable" });

    if (!troupes || typeof troupes !== "object") {
      return res.status(400).json({ erreur: "Aucune troupe envoyee" });
    }

    const ville = await Ville.findOne({ proprietaire: req.user._id });
    if (!ville) return res.status(404).json({ erreur: "Aucune ville trouvee" });

    const bonusEvenement = await bonusActifs();
    const joueurComplet = await Joueur.findById(req.user._id).select("recherches");
    const bonusTech = bonusRecherches(joueurComplet?.recherches);
    await rafraichirVille(ville, bonusEvenement.multiplicateurProduction, bonusTech);

    // Validation stricte cote serveur : le joueur possede-t-il vraiment ces troupes ?
    const armeeEnvoyee = {};
    let totalEnvoye = 0;

    for (const [type, quantiteBrute] of Object.entries(troupes)) {
      const quantite = Number(quantiteBrute);
      if (!Number.isInteger(quantite) || quantite <= 0) continue;
      if (!TROUPES_CONFIG[type]) {
        return res.status(400).json({ erreur: `Type de troupe inconnu : ${type}` });
      }
      if ((ville.armee[type] || 0) < quantite) {
        return res.status(400).json({
          erreur: `Tu n'as que ${ville.armee[type] || 0} ${TROUPES_CONFIG[type].nom} en garnison`
        });
      }
      armeeEnvoyee[type] = quantite;
      totalEnvoye += quantite;
    }

    if (totalEnvoye === 0) {
      return res.status(400).json({ erreur: "Selectionne au moins une unite a envoyer" });
    }

    // Heros optionnel, verifie qu'il appartient bien au joueur
    let heros = null;
    let equipement = {};
    if (herosId) {
      heros = await HerosJoueur.findOne({ _id: herosId, joueur: req.user._id });
      if (!heros) return res.status(400).json({ erreur: "Heros introuvable" });
      const objets = await ObjetJoueur.find({ joueur: req.user._id, equipeSur: heros._id }).lean();
      equipement = bonusEquipement(objets);
    }

    const palierJoueur = palierMax(niveauBatiment(ville, "caserne") || 1);

    const resultat = resoudreBataille({
      armeeAttaquant: armeeEnvoyee,
      armeeDefenseur: camp.armee,
      herosAttaquant: heros,
      palierAttaquant: palierJoueur,
      palierDefenseur: camp.palier,
      bonusMuraille: camp.bonusMuraille || 1,
      bonusTechAttaquant: bonusTech,
      equipementHeros: equipement
    });

    // L'Hopital soigne une partie des blesses au lieu de les perdre
    const taux = tauxSoin(ville);
    const soignes = {};

    for (const [type, perte] of Object.entries(resultat.pertesAttaquant)) {
      const recuperes = Math.floor(perte * taux);
      const perteReelle = perte - recuperes;
      if (recuperes > 0) soignes[type] = recuperes;
      ville.armee[type] = Math.max(0, (ville.armee[type] || 0) - perteReelle);
    }

    // Butin, limite par la capacite de charge des survivants
    const butin = {};
    if (resultat.victoire) {
      let capaciteRestante = resultat.capaciteCharge;
      for (const [ressource, quantiteDisponible] of Object.entries(camp.butin)) {
        if (capaciteRestante <= 0) break;
        const multButinTech = 1 + (bonusTech.butin || 0) / 100;
        const disponibleAvecBonus = Math.floor(quantiteDisponible * bonusEvenement.multiplicateurButin * multButinTech);
        const pris = Math.min(disponibleAvecBonus, Math.floor(capaciteRestante / 5));
        if (pris > 0) {
          butin[ressource] = pris;
          capaciteRestante -= pris;
          ville.ressources[ressource] = (ville.ressources[ressource] || 0) + pris;

          await MouvementRessource.create({
            joueur: req.user._id,
            type: ressource,
            quantite: pris,
            origine: "butin_raid",
            soldeApres: ville.ressources[ressource]
          });
        }
      }
    }

    await ville.save();

    // Experience et prestige du joueur
    let experienceGagnee = 0;
    if (resultat.victoire) {
      experienceGagnee = Math.round(camp.experience * bonusEvenement.multiplicateurPrestige * bonusPrestige(ville));
      await Joueur.findByIdAndUpdate(req.user._id, {
        $inc: { pointsPrestige: experienceGagnee }
      });

      if (heros) {
        const multXpHeros = 1 + (bonusTech.experience_heros || 0) / 100;
        heros.experience += Math.round((camp.experience / 2) * multXpHeros);
        const seuil = heros.niveau * 100;
        while (heros.experience >= seuil) {
          heros.experience -= seuil;
          heros.niveau += 1;
        }
        await heros.save();
      }
    }

    // Un camp vaincu sur la carte disparait puis se reforme plus tard
    if (campSurCarte && resultat.victoire) {
      campSurCarte.vaincuPar = req.user._id;
      campSurCarte.reapparitionLe = new Date(Date.now() + 30 * 60 * 1000);
      await campSurCarte.save();
    }

    const rapport = await RapportBataille.create({
      joueur: req.user._id,
      ville: ville._id,
      typeCible: "camp_ennemi",
      nomCible: camp.nom,
      niveauCible: camp.niveau,
      victoire: resultat.victoire,
      tours: resultat.tours,
      armeeEnvoyee,
      pertesAttaquant: resultat.pertesAttaquant,
      pertesDefenseur: resultat.pertesDefenseur,
      survivants: resultat.survivantsAttaquant,
      butin,
      herosUtilise: resultat.herosUtilise,
      experienceGagnee
    });

    res.json({
      rapport,
      armee: ville.armee,
      ressources: ville.ressources,
      soignes,
      tauxSoin: Math.round(taux * 100)
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
