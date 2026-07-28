const jwt = require("jsonwebtoken");
const Joueur = require("../models/Joueur");

async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ erreur: "Non authentifie" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const joueur = await Joueur.findById(payload.id).select("-motDePasse");
    if (!joueur || joueur.banni) {
      return res.status(401).json({ erreur: "Compte invalide ou banni" });
    }
    req.user = joueur;
    next();
  } catch (err) {
    res.status(401).json({ erreur: "Token invalide ou expire" });
  }
}

module.exports = auth;
