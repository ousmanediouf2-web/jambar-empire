# Jambar Empire

Jeu de strategie MMO type Empire War / Evony, ancre sur la carte de la Senegambie.

## Structure

```
backend/     Express + MongoDB + Socket.IO
frontend/    React + Vite (web, puis Capacitor pour Android/iOS, Tauri pour Windows)
```

## Demarrage rapide

### Backend
```
cd backend
cp .env.example .env    # completer MONGODB_URI et JWT_SECRET
npm install
npm run dev
```

### Frontend (web)
```
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Build Android/iOS (Capacitor)
```
cd frontend
npm run build
npx cap add android
npx cap add ios
npx cap open android   # ou ios
```

### Build Windows (Tauri)
```
cd frontend
npm install @tauri-apps/cli --save-dev
npx tauri build
```

## Deploiement backend

Deploie le dossier `backend/` sur Render (comme AgroSmart), avec les variables
d'environnement de `.env.example` renseignees dans le dashboard Render.

## Modeles principaux (backend/models)

- `Joueur` - compte, role (joueur/admin), rang, villes possedees
- `Region` - les 15 Province City (PC), Dakar = capitale
- `CountryCity` - les departements (CC) a l'interieur d'une region
- `Tile` - case de terrain (foret, prairie, lac, montagne, colline, vide)
- `Ville` - base construite par un joueur sur une tile vide
- `MouvementRessource` - journal (ledger) de tracabilite de chaque ressource
- `LogActionAdmin` - trace chaque action admin (anti-abus)
- `Evenement`, `Offre`, `MoyenPaiement`, `Transaction` - boutique et evenements
- `BatailleDuRoi` - evenement hebdomadaire pour le controle de Dakar
- `Alliance` - alliances de joueurs

## Compte admin

Pour transformer un joueur existant en administrateur, modifie son champ
`role` a `"admin"` directement dans MongoDB (via Compass ou Atlas). Toutes
les routes `/api/admin/*` verifient ce role avant d'autoriser l'action.

## Telechargement multi-plateforme (frontend/src/pages/Telechargement.jsx)

Page accessible sur `/telechargement` qui detecte l'appareil du visiteur et propose :
- **Android** : lien de telechargement direct d'un `.apk` (a heberger sur GitHub Releases)
- **Windows** : lien de telechargement direct d'un `.msi`/`.exe` (a heberger sur GitHub Releases)
- **iOS** : installation via PWA ("Ajouter a l'ecran d'accueil" dans Safari), pas de fichier a telecharger

Remplace `LIEN_APK` et `LIEN_WINDOWS` dans `Telechargement.jsx` par tes vrais liens
GitHub Releases une fois les builds Capacitor/Tauri generes.

## Configuration PWA (pour iOS notamment)

- `public/manifest.json` - nom, icones, couleur de theme
- `public/service-worker.js` - mise en cache basique pour fonctionnement hors-ligne
- `src/pwa.js` - enregistrement du service worker + gestion du prompt d'installation

Pense a ajouter tes propres icones dans `public/icons/icon-192.png` et `icon-512.png`.

## Interface admin (frontend/src/pages/admin)

Accessible sur `/admin/connexion` (connexion) puis `/admin` (tableau de bord),
reserve aux comptes avec `role: "admin"` en base :

- `AdminJoueurs.jsx` - liste des joueurs, historique de tracabilite des ressources
  (detection de triche), ban/deban
- `AdminEvenements.jsx` - creation/suppression d'evenements avec dates de debut/fin
- `AdminOffres.jsx` - creation de packs (offres) et activation des moyens de paiement

Le token admin est stocke dans `localStorage` (`token_admin`) et envoye automatiquement
sur chaque requete via `src/services/api.js`. Toute reponse 401 deconnecte automatiquement.

## Systeme de ressources

Chaque ville a 6 ressources :
- **argent** - monnaie de base, gagnee en jouant (attaques, production, quetes)
- **bois** - recolte sur les tiles foret
- **ble** (nourriture) - recolte sur les tiles prairie et lac
- **pierre** - recolte sur les tiles colline
- **fer** - recolte sur les tiles montagne
- **or** - monnaie premium, rare a obtenir en jeu, principalement via les achats (packs/offres)

## Pages joueur (frontend/src/pages)

- `/connexion`, `/inscription` - creation de compte et connexion (token stocke
  separement de l'admin sous `token_joueur` dans localStorage, via
  `src/services/apiJoueur.js`)
- `/jeu` - tableau de bord : ressources de la ville, armee, protection debutant
- `/jeu/carte` - carte du monde en Canvas, generee a partir de
  `/api/carte/regions` et `/api/carte/tiles`, avec legende des terrains et
  clic sur une case pour voir son detail

## Peupler la base de donnees (seed)

Une fois `MONGODB_URI` configure dans `backend/.env`, lance :

```
cd backend
npm run seed
```

Ce script :
- Supprime les regions/departements/tiles existants (pour pouvoir relancer sans doublon)
- Cree les 15 regions (14 du Senegal + la Gambie) avec leurs departements reels
  (Country City), une position approximative sur la carte, et un bonus de
  ressource par region
- Genere une grille de terrain de 60x40 cases (1200x800, pas a 20 unites),
  chaque case rattachee au departement de la region la plus proche, avec un
  type de terrain tire selon une ponderation propre a chaque region
  (ex: plus de montagne pres de Kedougou, plus de foret en Casamance,
  plus de lac pres des fleuves Senegal/Gambie)

A relancer a chaque fois que tu modifies `backend/seed/regionsData.js` ou
les ponderations de terrain dans `backend/seed/seed.js`.

## Routes carte (publiques, backend/routes/carte.js)

- `GET /api/carte/regions` - les 15 regions avec leur proprietaire de palais
- `GET /api/carte/tiles?xMin=&xMax=&yMin=&yMax=` - les tiles dans une zone
  donnee (pour charger seulement la portion de carte visible a l'ecran)

## Securite deja en place

- Mots de passe haches (bcrypt)
- JWT avec expiration
- Rate limiting sur connexion/inscription
- Journal des mouvements de ressources (tracabilite anti-triche)
- Log de chaque action admin (avant/apres, IP)
- Toute logique de jeu (combat, production, placement) calculee cote serveur uniquement
