import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

function Quetes() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  function charger() {
    return apiJoueur.get("/api/quetes").then((res) => {
      setDonnees(res.data);
      setChargement(false);
    });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement des quetes...</p>;

  async function reclamer(code) {
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post(`/api/quetes/${code}/reclamer`);
      setMessage(
        `${data.message} — ` +
        Object.entries(data.gains).map(([k, v]) => `+${v} ${k}`).join(", ")
      );
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de la reclamation");
    } finally {
      setEnCours(false);
    }
  }

  const aReclamer = donnees.quetes.filter((q) => q.peutReclamer).length;

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Quetes</h1>
      </div>

      {aReclamer > 0 && (
        <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>
          {aReclamer} recompense(s) a reclamer
        </p>
      )}
      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {Object.entries(donnees.categories).map(([cle, cat]) => {
        const liste = donnees.quetes.filter((q) => q.categorie === cle);
        if (liste.length === 0) return null;

        return (
          <div key={cle} style={{ marginTop: "1.75rem" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 0.25rem", color: cat.couleur }}>{cat.nom}</h2>
            <div style={s.grille}>
              {liste.map((q) => {
                const pourcent = Math.min(100, Math.round((q.progression.actuel / q.progression.cible) * 100));
                return (
                  <div
                    key={q.code}
                    style={{
                      ...s.carte,
                      marginTop: 0,
                      borderColor: q.peutReclamer ? couleurs.vertClair : cat.couleur,
                      opacity: q.dejaReclamee ? 0.6 : 1
                    }}
                  >
                    <strong style={{ fontSize: "15px" }}>{q.titre}</strong>
                    <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.75, margin: "0.35rem 0" }}>
                      {q.description}
                    </p>

                    {/* Barre de progression */}
                    <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "6px", height: "10px", overflow: "hidden", margin: "0.5rem 0" }}>
                      <div style={{ width: `${pourcent}%`, height: "100%", background: q.terminee ? couleurs.vertClair : cat.couleur }} />
                    </div>
                    <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.75, margin: 0 }}>
                      {q.progression.actuel} / {q.progression.cible}
                    </p>

                    <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", color: couleurs.or, margin: "0.5rem 0 0" }}>
                      Recompense : {Object.entries(q.recompense).map(([k, v]) => `${v} ${k}`).join(", ")}
                    </p>

                    {q.peutReclamer ? (
                      <button style={{ ...s.bouton, marginTop: "0.6rem" }} disabled={enCours} onClick={() => reclamer(q.code)}>
                        Reclamer
                      </button>
                    ) : q.dejaReclamee ? (
                      <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.6, margin: "0.5rem 0 0" }}>
                        {q.prochaineDispo
                          ? `Disponible le ${new Date(q.prochaineDispo).toLocaleString()}`
                          : "Deja reclamee"}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Quetes;
