import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const LIBELLE_STATUT = {
  en_attente: "En attente de paiement",
  reussi: "Livre",
  echoue: "Echoue",
  rembourse: "Rembourse"
};

function Boutique() {
  const [offres, setOffres] = useState([]);
  const [moyens, setMoyens] = useState([]);
  const [achats, setAchats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [moyenChoisi, setMoyenChoisi] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  function charger() {
    return Promise.all([
      apiJoueur.get("/api/boutique"),
      apiJoueur.get("/api/boutique/mes-achats")
    ]).then(([res1, res2]) => {
      setOffres(res1.data.offres || []);
      setMoyens(res1.data.moyensPaiement || []);
      setAchats(res2.data || []);
      if (!moyenChoisi && res1.data.moyensPaiement?.[0]) {
        setMoyenChoisi(res1.data.moyensPaiement[0]._id);
      }
      setChargement(false);
    });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement de la boutique...</p>;

  async function acheter(offre) {
    if (!moyenChoisi) {
      setErreur("Choisis un moyen de paiement");
      return;
    }
    setErreur("");
    setMessage("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/boutique/acheter", {
        offreId: offre._id,
        moyenPaiementId: moyenChoisi
      });
      setMessage(data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de l'achat");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Boutique</h1>
      </div>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {moyens.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <label style={{ fontFamily: "sans-serif", fontSize: "13px", marginRight: "0.5rem" }}>
            Moyen de paiement :
          </label>
          <select value={moyenChoisi} onChange={(e) => setMoyenChoisi(e.target.value)} style={s.champ}>
            {moyens.map((m) => (
              <option key={m._id} value={m._id}>{m.nom}</option>
            ))}
          </select>
        </div>
      )}

      {offres.length === 0 ? (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.75, margin: 0 }}>
            Aucune offre disponible pour l'instant. L'administrateur peut en creer depuis la page d'administration.
          </p>
        </div>
      ) : (
        <div style={s.grille}>
          {offres.map((o) => (
            <div key={o._id} style={{ ...s.carte, marginTop: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "16px" }}>{o.nom}</strong>
                <span style={{ color: couleurs.or, fontWeight: 700 }}>{o.prix} FCFA</span>
              </div>
              {o.description && (
                <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75, margin: "0.4rem 0" }}>
                  {o.description}
                </p>
              )}
              <div style={{ fontFamily: "sans-serif", fontSize: "12px", lineHeight: 1.7 }}>
                {Object.entries(o.contenu || {})
                  .filter(([cle, q]) => cle !== "_id" && q > 0)
                  .map(([cle, q]) => (
                    <div key={cle}>{q} {cle}</div>
                  ))}
              </div>
              <button
                style={{ ...s.bouton, marginTop: "0.75rem" }}
                disabled={enCours || moyens.length === 0}
                onClick={() => acheter(o)}
              >
                {moyens.length === 0 ? "Aucun moyen de paiement" : "Acheter"}
              </button>
            </div>
          ))}
        </div>
      )}

      {achats.length > 0 && (
        <div style={s.carte}>
          <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Mes achats</h3>
          {achats.map((t) => (
            <div key={t._id} style={s.ligne}>
              <span>
                {t.offre?.nom || "Offre supprimee"} — {t.montant} FCFA
                <div style={{ fontSize: "11.5px", opacity: 0.6 }}>
                  {new Date(t.dateCreation).toLocaleString()}
                </div>
              </span>
              <span style={{ color: t.statut === "reussi" ? couleurs.vertClair : couleurs.bronze }}>
                {LIBELLE_STATUT[t.statut] || t.statut}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Boutique;
