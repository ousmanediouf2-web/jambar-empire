import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiJoueur from "../services/apiJoueur";
import { styles, couleurs } from "../theme";
import logo from "../assets/logo-carre.png";

function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const navigate = useNavigate();

  async function seConnecter(e) {
    e.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/auth/connexion", { email, motDePasse });
      localStorage.setItem("token_joueur", data.token);
      navigate("/jeu");
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur de connexion");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={styles.page}>
      <img src={logo} alt="Jambar Empire" style={{ width: "150px", marginBottom: "0.5rem" }} />
      <h1 style={styles.titre}>Retour au Royaume</h1>
      <p style={{ ...styles.sousTitre, marginBottom: "1.5rem" }}>
        Ton empire t'attend, souverain.
      </p>

      <form onSubmit={seConnecter} style={styles.panneau}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
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
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            style={styles.champ}
          />
          <button type="submit" disabled={enCours} style={styles.boutonPrincipal}>
            {enCours ? "Connexion..." : "Entrer dans l'Empire"}
          </button>
          {erreur && <p style={styles.erreur}>{erreur}</p>}
        </div>

        <div style={styles.separateur} />

        <p style={{ textAlign: "center", margin: 0 }}>
          <span style={{ fontSize: "13px", opacity: 0.7, fontFamily: "sans-serif" }}>Pas encore de royaume ? </span>
          <Link to="/inscription" style={styles.lien}>Fonder son empire</Link>
        </p>
      </form>

      <Link to="/" style={{ ...styles.lien, marginTop: "1.5rem" }}>Retour a l'accueil</Link>
    </div>
  );
}

export default Connexion;
