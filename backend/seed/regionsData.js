// Les 15 regions du jeu (14 regions du Senegal + la Gambie), avec leurs
// departements reels (Country City) et une position approximative sur la
// carte du jeu (grille 0-1200 x 0-800, pas des coordonnees GPS exactes).

module.exports = [
  {
    nom: "Dakar",
    estCapitale: true,
    bonusRessource: null,
    coordonnees: { x: 60, y: 260 },
    countryCities: ["Dakar", "Pikine", "Guediawaye", "Rufisque"]
  },
  {
    nom: "Thies",
    estCapitale: false,
    bonusRessource: "pierre",
    coordonnees: { x: 200, y: 220 },
    countryCities: ["Thies", "Mbour", "Tivaouane"]
  },
  {
    nom: "Diourbel",
    estCapitale: false,
    bonusRessource: "arachide",
    coordonnees: { x: 350, y: 230 },
    countryCities: ["Diourbel", "Bambey", "Mbacke"]
  },
  {
    nom: "Saint-Louis",
    estCapitale: false,
    bonusRessource: "irrigation",
    coordonnees: { x: 150, y: 50 },
    countryCities: ["Saint-Louis", "Dagana", "Podor"]
  },
  {
    nom: "Louga",
    estCapitale: false,
    bonusRessource: "elevage",
    coordonnees: { x: 300, y: 100 },
    countryCities: ["Louga", "Kebemer", "Linguere"]
  },
  {
    nom: "Matam",
    estCapitale: false,
    bonusRessource: "irrigation",
    coordonnees: { x: 700, y: 80 },
    countryCities: ["Matam", "Kanel", "Raneou"]
  },
  {
    nom: "Fatick",
    estCapitale: false,
    bonusRessource: "peche_sel",
    coordonnees: { x: 300, y: 350 },
    countryCities: ["Fatick", "Foundiougne", "Gossas"]
  },
  {
    nom: "Kaolack",
    estCapitale: false,
    bonusRessource: "commerce_sel",
    coordonnees: { x: 450, y: 380 },
    countryCities: ["Kaolack", "Guinguineo", "Nioro du Rip"]
  },
  {
    nom: "Kaffrine",
    estCapitale: false,
    bonusRessource: "cereales",
    coordonnees: { x: 500, y: 280 },
    countryCities: ["Kaffrine", "Birkilane", "Koungheul", "Malem Hodar"]
  },
  {
    nom: "Tambacounda",
    estCapitale: false,
    bonusRessource: "elevage",
    coordonnees: { x: 750, y: 300 },
    countryCities: ["Tambacounda", "Bakel", "Goudiry", "Koumpentoum"]
  },
  {
    nom: "Kedougou",
    estCapitale: false,
    bonusRessource: "or",
    coordonnees: { x: 850, y: 450 },
    countryCities: ["Kedougou", "Salemata", "Saraya"]
  },
  {
    nom: "Kolda",
    estCapitale: false,
    bonusRessource: "agriculture",
    coordonnees: { x: 550, y: 480 },
    countryCities: ["Kolda", "Velingara", "Medina Yoro Foulah"]
  },
  {
    nom: "Sedhiou",
    estCapitale: false,
    bonusRessource: "bois",
    coordonnees: { x: 350, y: 470 },
    countryCities: ["Sedhiou", "Bounkiling", "Goudomp"]
  },
  {
    nom: "Ziguinchor",
    estCapitale: false,
    bonusRessource: "bois",
    coordonnees: { x: 150, y: 480 },
    countryCities: ["Ziguinchor", "Bignona", "Oussouye"]
  },
  {
    nom: "Gambie",
    estCapitale: false,
    bonusRessource: "commerce_fluvial",
    coordonnees: { x: 400, y: 430 },
    countryCities: ["Banjul", "Kanifing", "Brikama", "Kerewan", "Basse Santa Su"]
  }
];
