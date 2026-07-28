import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

const LABELS = { ble: "Nourriture", bois: "Bois", pierre: "Pierre", fer: "Fer", argent: "Argent" };

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

function MarcheEchange() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [donne, setDonne] = useState("ble");
  const [recoit, setRecoit] = useState("bois");
  const [quantite, setQuantite] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  function charger() {
    return apiJoueur.get("/api/echange").then((r) => { setDonnees(r.data); setChargement(false); });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement du marche...</p>;

  async function echanger() {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/echange/echanger", {
        donne, recoit, quantite: Number(quantite)
      });
      setMessage(data.message);
      setQuantite("");
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Echange impossible");
    } finally { setEnCours(false); }
  }

  const gainEstime = Math.floor((Number(quantite) || 0) * donnees.taux / 100);

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Marche</h1>
      </div>

      {donnees.niveauMarche < 1 ? (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: 0 }}>
            Tu n'as pas encore de Marche. Construis-en un dans ta cite pour echanger tes ressources.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.8 }}>
            Marche niveau {donnees.niveauMarche} — taux d'echange : {donnees.taux}%.
            Ameliore ton Marche pour perdre moins a chaque transaction.
          </p>

          {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
          {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

          <div style={s.carte}>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ fontFamily: "sans-serif", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                Je donne
                <select value={donne} onChange={(e) => setDonne(e.target.value)} style={s.champ}>
                  {donnees.echangeables.map((r) => (
                    <option key={r} value={r}>{LABELS[r]} ({donnees.ressources[r] ?? 0})</option>
                  ))}
                </select>
              </label>

              <label style={{ fontFamily: "sans-serif", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                Quantite
                <input type="number" min="1" placeholder="0" value={quantite}
                  onChange={(e) => setQuantite(e.target.value)} style={{ ...s.champ, width: "120px" }} />
              </label>

              <label style={{ fontFamily: "sans-serif", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                Je recois
                <select value={recoit} onChange={(e) => setRecoit(e.target.value)} style={s.champ}>
                  {donnees.echangeables.map((r) => (
                    <option key={r} value={r}>{LABELS[r]}</option>
                  ))}
                </select>
              </label>

              <button style={s.bouton} disabled={enCours || !quantite} onClick={echanger}>
                Echanger
              </button>
            </div>

            {gainEstime > 0 && (
              <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.or, marginTop: "0.75rem" }}>
                Tu recevras environ {gainEstime} {LABELS[recoit]}
              </p>
            )}
          </div>

          <div style={s.carte}>
            <strong style={{ color: couleurs.or }}>Tes ressources</strong>
            <div style={{ fontFamily: "sans-serif", fontSize: "13px", lineHeight: 1.8, marginTop: "0.35rem" }}>
              {donnees.echangeables.map((r) => (
                <div key={r}>{LABELS[r]} : {donnees.ressources[r] ?? 0}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MarcheEchange;
