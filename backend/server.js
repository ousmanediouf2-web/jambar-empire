require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");
const connecterMongoDB = require("./config/db");

// Mongoose doit connaitre tous les modeles au demarrage, sinon populate()
// plante avec MissingSchemaError des qu'un modele n'a jamais ete charge
// explicitement ailleurs (ex: Alliance, reference seulement via ref: "Alliance").
require("./models/Joueur");
require("./models/Region");
require("./models/CountryCity");
require("./models/Tile");
require("./models/Ville");
require("./models/Alliance");
require("./models/MouvementRessource");
require("./models/LogActionAdmin");
require("./models/Evenement");
require("./models/Offre");
require("./models/MoyenPaiement");
require("./models/Transaction");
require("./models/BatailleDuRoi");
require("./models/HerosJoueur");
require("./models/RapportBataille");
require("./models/Marche");
require("./models/MessageAlliance");
require("./models/QueteJoueur");
require("./models/MessagePrive");
require("./models/ObjetJoueur");
require("./models/ObjetInventaire");
require("./models/CampCarte");

const auth = require("./middlewares/auth");
const isAdmin = require("./middlewares/isAdmin");

const routesAuth = require("./routes/auth");
const routesCarte = require("./routes/carte");
const routesJoueur = require("./routes/joueur");
const routesHeros = require("./routes/heros");
const routesTroupes = require("./routes/troupes");
const routesCombat = require("./routes/combat");
const routesMarche = require("./routes/marche");
const routesAlliance = require("./routes/alliance");
const routesClassement = require("./routes/classement");
const routesBoutique = require("./routes/boutique");
const routesEvenements = require("./routes/evenements");
const routesRecherche = require("./routes/recherche");
const routesQuetes = require("./routes/quetes");
const routesMessages = require("./routes/messages");
const routesInventaire = require("./routes/inventaire");
const routesObjets = require("./routes/objets");
const routesEchange = require("./routes/echangeMarche");
const routesAdminDons = require("./routes/admin/dons");
const routesAdminJoueurs = require("./routes/admin/joueurs");
const routesAdminEvenements = require("./routes/admin/evenements");
const routesAdminOffres = require("./routes/admin/offres");

const app = express();
const serveur = http.createServer(app);
const io = new Server(serveur, {
  cors: { origin: process.env.CORS_ORIGIN || "*" }
});

app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/auth", routesAuth);
app.use("/api/carte", routesCarte);
app.use("/api/joueur", auth, routesJoueur);
app.use("/api/heros", auth, routesHeros);
app.use("/api/troupes", auth, routesTroupes);
app.use("/api/combat", auth, routesCombat);
app.use("/api/marche", auth, routesMarche);
app.use("/api/alliance", auth, routesAlliance);
app.use("/api/classement", auth, routesClassement);
app.use("/api/boutique", auth, routesBoutique);
app.use("/api/evenements", auth, routesEvenements);
app.use("/api/recherche", auth, routesRecherche);
app.use("/api/quetes", auth, routesQuetes);
app.use("/api/messages", auth, routesMessages);
app.use("/api/inventaire", auth, routesInventaire);
app.use("/api/objets", auth, routesObjets);
app.use("/api/echange", auth, routesEchange);

// Toutes les routes admin passent par auth (etre connecte) PUIS isAdmin (avoir le role)
app.use("/api/admin/joueurs", auth, isAdmin, routesAdminJoueurs);
app.use("/api/admin/evenements", auth, isAdmin, routesAdminEvenements);
app.use("/api/admin/offres", auth, isAdmin, routesAdminOffres);
app.use("/api/admin/dons", auth, isAdmin, routesAdminDons);

app.get("/api/health", (req, res) => res.json({ statut: "ok" }));

// Filet de securite : toute erreur non geree est journalisee avec sa pile,
// pour qu'un 500 soit diagnosticable depuis les logs.
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}] erreur :`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ erreur: err.message || "Erreur serveur" });
});

io.on("connection", (socket) => {
  console.log("Client connecte :", socket.id);

  socket.on("disconnect", () => {
    console.log("Client deconnecte :", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

connecterMongoDB().then(() => {
  serveur.listen(PORT, () => {
    console.log(`Serveur demarre sur le port ${PORT}`);
  });
});
