import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

function Evenements() {
  const [actifs, setActifs] = useState(null);
  const [aVenir, setAVenir] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([
      apiJoueur.get("/api/evenements"),
      apiJoueur.get("/api/evenements/a-venir")
    ]).then(([res1, res2]) => {
      setActifs(res1.data);
      setAVenir(res2.data);
      setChargement(false);
    });
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement des evenements...</p>;

  const enCours = actifs?.evenements || [];

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Evenements</h1>
      </div>

      <h2 style={{ fontSize: "16px", marginTop: "1.5rem", color: couleurs.or }}>En cours</h2>
      {enCours.length === 0 ? (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.75, margin: 0 }}>
            Aucun evenement en cours. L'administrateur peut en programmer depuis la page d'administration.
          </p>
        </div>
      ) : (
        <>
          <div style={s.carte}>
            <strong style={{ color: couleurs.vertClair }}>Bonus actifs</strong>
            <div style={{ fontFamily: "sans-serif", fontSize: "13px", lineHeight: 1.8, marginTop: "0.35rem" }}>
              <div>Production : x{actifs.multiplicateurProduction}</div>
              <div>Prestige de bataille : x{actifs.multiplicateurPrestige}</div>
              <div>Butin de raid : x{actifs.multiplicateurButin}</div>
            </div>
          </div>

          {enCours.map((ev) => (
            <div key={ev._id} style={{ ...s.carte, borderColor: couleurs.vertClair }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <strong style={{ fontSize: "16px" }}>{ev.titre}</strong>
                <span style={{ color: couleurs.vertClair, fontSize: "12.5px" }}>{ev.effet}</span>
              </div>
              {ev.description && (
                <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75, margin: "0.4rem 0" }}>
                  {ev.description}
                </p>
              )}
              <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.6, margin: 0 }}>
                Jusqu'au {new Date(ev.dateFin).toLocaleString()}
              </p>
            </div>
          ))}
        </>
      )}

      <h2 style={{ fontSize: "16px", marginTop: "2rem", color: couleurs.or }}>A venir</h2>
      {aVenir.length === 0 ? (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.75, margin: 0 }}>
            Aucun evenement programme.
          </p>
        </div>
      ) : (
        aVenir.map((ev) => (
          <div key={ev._id} style={s.carte}>
            <strong>{ev.titre}</strong>
            {ev.description && (
              <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75, margin: "0.4rem 0" }}>
                {ev.description}
              </p>
            )}
            <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.6, margin: 0 }}>
              Du {new Date(ev.dateDebut).toLocaleString()} au {new Date(ev.dateFin).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default Evenements;
