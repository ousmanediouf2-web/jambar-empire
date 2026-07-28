import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { portraitHeros } from "../../data/sprites";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const style = {
  page: {
    fontFamily: "Georgia, serif",
    background: couleurs.noir,
    color: couleurs.orClair,
    minHeight: "100vh",
    padding: "1.5rem 1rem",
    boxSizing: "border-box"
  },
  bouton: {
    background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`,
    border: "none",
    borderRadius: "8px",
    padding: "0.7rem 1.3rem",
    color: couleurs.noirProfond,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Georgia, serif"
  },
  boutonSecondaire: {
    background: "rgba(227,178,60,0.1)",
    border: `1px solid rgba(227,178,60,0.4)`,
    borderRadius: "8px",
    padding: "0.7rem 1.3rem",
    color: couleurs.orClair,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "Georgia, serif"
  },
  grille: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "1rem",
    marginTop: "1rem"
  }
};

function Heros() {
  const [mesHeros, setMesHeros] = useState([]);
  const [catalogue, setCatalogue] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState("mes-heros");

  function charger() {
    return Promise.all([
      apiJoueur.get("/api/heros/mes-heros"),
      apiJoueur.get("/api/heros/catalogue")
    ]).then(([resMes, resCat]) => {
      setMesHeros(resMes.data);
      setCatalogue(resCat.data);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={style.page}>Chargement des heros...</p>;

  async function recruter(premium) {
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/heros/recruter", { premium });
      setMessage(data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors du recrutement");
    } finally {
      setEnCours(false);
    }
  }

  function couleurRarete(rarete) {
    return catalogue?.raretes?.[rarete]?.couleur || "#B8B2A4";
  }

  function CarteHeros({ heros, possede }) {
    const stats = heros.stats || heros.statsNiveau1;
    return (
      <div
        style={{
          background: "rgba(245,233,200,0.05)",
          border: `1px solid ${couleurRarete(heros.rarete)}`,
          borderRadius: "10px",
          padding: "1rem",
          opacity: possede === false ? 0.55 : 1
        }}
      >
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
          <img
            src={portraitHeros(heros.codeHeros || heros.code)}
            alt=""
            style={{ width: "62px", height: "82px", objectFit: "contain", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "16px" }}>{heros.nom}</strong>
              <span style={{ fontSize: "11px", color: couleurRarete(heros.rarete), textTransform: "uppercase" }}>
                {heros.rarete}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "12px", opacity: 0.75, fontFamily: "sans-serif", margin: "0.35rem 0" }}>
          {heros.specialite}
        </p>

        {possede && (
          <p style={{ fontSize: "12px", margin: "0.35rem 0", color: couleurs.vertClair }}>
            Niveau {heros.niveau} — {"★".repeat(heros.etoiles || 1)}
          </p>
        )}

        {stats && (
          <div style={{ fontSize: "12px", fontFamily: "sans-serif", marginTop: "0.5rem", lineHeight: 1.7 }}>
            <div>Attaque {stats.attaque} · Defense {stats.defense}</div>
            <div>Sante {stats.sante} · Leadership {stats.leadership}</div>
            <div style={{ color: couleurs.or }}>Puissance {stats.puissance}</div>
          </div>
        )}

        {heros.histoire && (
          <p style={{ fontSize: "11px", opacity: 0.6, fontStyle: "italic", marginTop: "0.6rem", fontFamily: "sans-serif" }}>
            {heros.histoire}
          </p>
        )}
      </div>
    );
  }

  const codesPossedes = new Set(mesHeros.map((h) => h.codeHeros));

  return (
    <div style={style.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={style.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Taverne des Heros</h1>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
        <button style={style.bouton} disabled={enCours} onClick={() => recruter(false)}>
          Recruter ({catalogue?.coutRecrutement?.argent} argent)
        </button>
        <button style={style.bouton} disabled={enCours} onClick={() => recruter(true)}>
          Invocation doree ({catalogue?.coutInvocationOr} or)
        </button>
      </div>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
        <button
          style={onglet === "mes-heros" ? style.bouton : style.boutonSecondaire}
          onClick={() => setOnglet("mes-heros")}
        >
          Mes heros ({mesHeros.length})
        </button>
        <button
          style={onglet === "catalogue" ? style.bouton : style.boutonSecondaire}
          onClick={() => setOnglet("catalogue")}
        >
          Encyclopedie ({catalogue?.heros?.length || 0})
        </button>
      </div>

      {onglet === "mes-heros" && (
        <>
          {mesHeros.length === 0 ? (
            <p style={{ fontFamily: "sans-serif", opacity: 0.7, marginTop: "1.5rem" }}>
              Aucun heros pour l'instant. Recrute ton premier champion ci-dessus.
            </p>
          ) : (
            <div style={style.grille}>
              {mesHeros.map((h) => (
                <CarteHeros key={h._id} heros={h} possede />
              ))}
            </div>
          )}
        </>
      )}

      {onglet === "catalogue" && (
        <div style={style.grille}>
          {catalogue?.heros?.map((h) => (
            <CarteHeros key={h.code} heros={h} possede={codesPossedes.has(h.code)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Heros;
