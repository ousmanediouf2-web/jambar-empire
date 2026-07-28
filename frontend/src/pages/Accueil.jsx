import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { styles, couleurs } from "../theme";
import logo from "../assets/logo.png";

function Accueil() {
  const [statutBackend, setStatutBackend] = useState(null);

  useEffect(() => {
    api.get("/api/health").then(() => setStatutBackend(true)).catch(() => setStatutBackend(false));
  }, []);

  const estConnecte = Boolean(localStorage.getItem("token_joueur"));

  return (
    <div
      style={{
        ...styles.page,
        backgroundImage: `linear-gradient(rgba(10,8,6,0.82), rgba(10,8,6,0.95)), url(/images/ville-fond.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <img src={logo} alt="Jambar Empire" style={{ width: "min(280px, 70vw)", marginBottom: "1rem" }} />

      <p style={{ ...styles.sousTitre, marginBottom: "2rem" }}>
        Batis ta cite, leve tes armees, recrute des heros legendaires et conquiers
        le continent de Jambar. Un royaume ne se herite pas, il se conquiert.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        {estConnecte ? (
          <Link to="/jeu" style={{ ...styles.boutonPrincipal, width: "auto", padding: "0.8rem 2rem", textDecoration: "none" }}>
            Reprendre la partie
          </Link>
        ) : (
          <>
            <Link to="/inscription" style={{ ...styles.boutonPrincipal, width: "auto", padding: "0.8rem 2rem", textDecoration: "none" }}>
              Fonder mon empire
            </Link>
            <Link to="/connexion" style={styles.boutonSecondaire}>
              Se connecter
            </Link>
          </>
        )}
        <Link to="/telechargement" style={styles.boutonSecondaire}>
          Telecharger le jeu
        </Link>
      </div>

      {/* Trois piliers du jeu */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          maxWidth: "760px",
          width: "100%",
          marginTop: "3rem"
        }}
      >
        {[
          { titre: "Batis", texte: "Developpe ta capitale, ameliore tes batiments et fais prosperer ton economie." },
          { titre: "Conquiers", texte: "Explore la carte, capture des territoires et defends ta couronne." },
          { titre: "Allie-toi", texte: "Rejoins une alliance et mene des guerres a grande echelle." }
        ].map((pilier) => (
          <div
            key={pilier.titre}
            style={{
              background: "rgba(26,23,18,0.75)",
              border: `1px solid rgba(227,178,60,0.3)`,
              borderRadius: "12px",
              padding: "1.25rem"
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem", color: couleurs.or, fontSize: "17px" }}>{pilier.titre}</h3>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.8, fontFamily: "sans-serif", lineHeight: 1.6 }}>
              {pilier.texte}
            </p>
          </div>
        ))}
      </div>

      <p style={{ marginTop: "2.5rem", fontSize: "11px", opacity: 0.5, fontFamily: "sans-serif" }}>
        {statutBackend === null && "Verification du serveur..."}
        {statutBackend === true && "Serveur en ligne"}
        {statutBackend === false && "Serveur momentanement injoignable"}
      </p>
    </div>
  );
}

export default Accueil;
