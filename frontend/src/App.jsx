import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { enregistrerServiceWorker } from "./pwa";
import Accueil from "./pages/Accueil";
import Telechargement from "./pages/Telechargement";
import Calibrage from "./pages/Calibrage";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import EcranVille from "./pages/jeu/EcranVille";
import Carte from "./pages/jeu/Carte";
import Heros from "./pages/jeu/Heros";
import Entrainement from "./pages/jeu/Entrainement";
import Combat from "./pages/jeu/Combat";
import Alliance from "./pages/jeu/Alliance";
import Classement from "./pages/jeu/Classement";
import Boutique from "./pages/jeu/Boutique";
import Evenements from "./pages/jeu/Evenements";
import Recherche from "./pages/jeu/Recherche";
import Quetes from "./pages/jeu/Quetes";
import Messages from "./pages/jeu/Messages";
import Inventaire from "./pages/jeu/Inventaire";
import Objets from "./pages/jeu/Objets";
import MarcheEchange from "./pages/jeu/Marche";
import AdminConnexion from "./pages/admin/AdminConnexion";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJoueurs from "./pages/admin/AdminJoueurs";
import AdminEvenements from "./pages/admin/AdminEvenements";
import AdminOffres from "./pages/admin/AdminOffres";
import AdminDons from "./pages/admin/AdminDons";

function App() {
  useEffect(() => {
    enregistrerServiceWorker();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/telechargement" element={<Telechargement />} />
        <Route path="/calibrage" element={<Calibrage />} />

        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/jeu" element={<EcranVille />} />
        <Route path="/jeu/carte" element={<Carte />} />
        <Route path="/jeu/heros" element={<Heros />} />
        <Route path="/jeu/entrainement" element={<Entrainement />} />
        <Route path="/jeu/combat" element={<Combat />} />
        <Route path="/jeu/alliance" element={<Alliance />} />
        <Route path="/jeu/classement" element={<Classement />} />
        <Route path="/jeu/boutique" element={<Boutique />} />
        <Route path="/jeu/evenements" element={<Evenements />} />
        <Route path="/jeu/recherche" element={<Recherche />} />
        <Route path="/jeu/quetes" element={<Quetes />} />
        <Route path="/jeu/messages" element={<Messages />} />
        <Route path="/jeu/inventaire" element={<Inventaire />} />
        <Route path="/jeu/objets" element={<Objets />} />
        <Route path="/jeu/marche" element={<MarcheEchange />} />

        <Route path="/admin/connexion" element={<AdminConnexion />} />
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminJoueurs />} />
          <Route path="joueurs" element={<AdminJoueurs />} />
          <Route path="evenements" element={<AdminEvenements />} />
          <Route path="offres" element={<AdminOffres />} />
          <Route path="dons" element={<AdminDons />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
