import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiJoueur from "../services/apiJoueur";
import { styles } from "../theme";
import logo from "../assets/logo-carre.png";

function Inscription() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const navigate = useNavigate();

  async function creerCompte(e) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/auth/inscription", { nom, email, motDePasse });
      localStorage.setItem("token_joueur", data.token);
      navigate("/jeu");
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de la creation du compte");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={styles.page}>
      <img src={logo} alt="Jambar Empire" style={{ width: "150px", marginBottom: "0.5rem" }} />
      <h1 style={styles.titre}>Fonde ton Empire</h1>
      <p style={{ ...styles.sousTitre, marginBottom: "1.5rem" }}>
        Une cite, une couronne, un destin. Le continent de Jambar attend son souverain.
      </p>

      <form onSubmit={creerCompte} style={styles.panneau}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <input
            placeholder="Nom de souverain"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            style={styles.champ}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.champ}
          />
          <input
            type="password"
            placeholder="Mot de passe (6 caracteres minimum)"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            minLength={6}
            style={styles.champ}
          />
          <button type="submit" disabled={enCours} style={styles.boutonPrincipal}>
            {enCours ? "Fondation en cours..." : "Fonder mon empire"}
          </button>
          {erreur && <p style={styles.erreur}>{erreur}</p>}
        </div>

        <div style={styles.separateur} />

        <p style={{ textAlign: "center", margin: 0 }}>
          <span style={{ fontSize: "13px", opacity: 0.7, fontFamily: "sans-serif" }}>Deja souverain ? </span>
          <Link to="/connexion" style={styles.lien}>Se connecter</Link>
        </p>
      </form>

      <Link to="/" style={{ ...styles.lien, marginTop: "1.5rem" }}>Retour a l'accueil</Link>
    </div>
  );
}

export default Inscription;
