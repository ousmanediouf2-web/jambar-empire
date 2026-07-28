import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { spriteTroupe } from "../../data/sprites";

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
    padding: "0.6rem 1.1rem",
    color: couleurs.noirProfond,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Georgia, serif"
  },
  boutonSecondaire: {
    background: "rgba(227,178,60,0.1)",
    border: "1px solid rgba(227,178,60,0.4)",
    borderRadius: "8px",
    padding: "0.6rem 1.1rem",
    color: couleurs.orClair,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "Georgia, serif"
  },
  carte: {
    background: "rgba(245,233,200,0.05)",
    border: "1px solid rgba(227,178,60,0.3)",
    borderRadius: "10px",
    padding: "1rem"
  },
  grille: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1rem",
    marginTop: "1rem"
  },
  champ: {
    width: "90px",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(227,178,60,0.35)",
    borderRadius: "6px",
    padding: "0.35rem 0.5rem",
    color: couleurs.orClair,
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  }
};

function listerUnites(objet) {
  if (!objet) return "aucune";
  const entrees = Object.entries(objet).filter(([, v]) => v > 0);
  if (entrees.length === 0) return "aucune";
  return entrees.map(([k, v]) => `${v} ${k.replace("_", " ")}`).join(", ");
}

function Combat() {
  const [camps, setCamps] = useState([]);
  const [troupesDispo, setTroupesDispo] = useState({});
  const [nomsTroupes, setNomsTroupes] = useState({});
  const [mesHeros, setMesHeros] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [campChoisi, setCampChoisi] = useState(null);
  const [selection, setSelection] = useState({});
  const [herosChoisi, setHerosChoisi] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [dernierRapport, setDernierRapport] = useState(null);

  function charger() {
    return Promise.all([
      apiJoueur.get("/api/combat/camps"),
      apiJoueur.get("/api/troupes"),
      apiJoueur.get("/api/heros/mes-heros"),
      apiJoueur.get("/api/combat/rapports")
    ]).then(([resCamps, resTroupes, resHeros, resRapports]) => {
      setCamps(resCamps.data);
      setTroupesDispo(resTroupes.data.armee || {});
      const noms = {};
      (resTroupes.data.types || []).forEach((t) => { noms[t.code] = t.nom; });
      setNomsTroupes(noms);
      setMesHeros(resHeros.data);
      setRapports(resRapports.data);
      setChargement(false);
    });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={style.page}>Chargement du champ de bataille...</p>;

  async function attaquer() {
    const troupes = {};
    for (const [type, valeur] of Object.entries(selection)) {
      const n = Number(valeur);
      if (Number.isInteger(n) && n > 0) troupes[type] = n;
    }
    if (Object.keys(troupes).length === 0) {
      setErreur("Selectionne au moins une unite a envoyer");
      return;
    }

    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/combat/attaquer-camp", {
        niveauCamp: campChoisi.niveau,
        troupes,
        herosId: herosChoisi || undefined
      });
      setDernierRapport(data.rapport);
      setCampChoisi(null);
      setSelection({});
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur pendant la bataille");
    } finally {
      setEnCours(false);
    }
  }

  const unitesDisponibles = Object.entries(troupesDispo).filter(([, q]) => q > 0);

  return (
    <div style={style.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={style.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Campagne</h1>
      </div>

      {/* Rapport de la derniere bataille */}
      {dernierRapport && (
        <div
          style={{
            ...style.carte,
            marginTop: "1rem",
            borderColor: dernierRapport.victoire ? couleurs.vertClair : "#E8837A"
          }}
        >
          <h2 style={{ margin: 0, color: dernierRapport.victoire ? couleurs.vertClair : "#E8837A" }}>
            {dernierRapport.victoire ? "Victoire !" : "Defaite"}
          </h2>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.5rem 0" }}>
            {dernierRapport.nomCible} — {dernierRapport.tours} tours de combat
            {dernierRapport.herosUtilise && ` — mene par ${dernierRapport.herosUtilise}`}
          </p>
          <div style={{ fontFamily: "sans-serif", fontSize: "12.5px", lineHeight: 1.8 }}>
            <div>Tes pertes : {listerUnites(dernierRapport.pertesAttaquant)}</div>
            <div>Pertes ennemies : {listerUnites(dernierRapport.pertesDefenseur)}</div>
            <div>Survivants : {listerUnites(dernierRapport.survivants)}</div>
            {dernierRapport.victoire && (
              <>
                <div style={{ color: couleurs.or }}>Butin : {listerUnites(dernierRapport.butin)}</div>
                <div style={{ color: couleurs.or }}>Prestige gagne : {dernierRapport.experienceGagnee}</div>
              </>
            )}
          </div>
          <button style={{ ...style.boutonSecondaire, marginTop: "0.75rem" }} onClick={() => setDernierRapport(null)}>
            Fermer
          </button>
        </div>
      )}

      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif" }}>{erreur}</p>}

      {/* Choix des camps */}
      <h2 style={{ fontSize: "16px", marginTop: "1.75rem", color: couleurs.or }}>Camps ennemis</h2>
      <div style={style.grille}>
        {camps.map((c) => (
          <div key={c.niveau} style={style.carte}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{c.nom}</strong>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>Niv. {c.niveau}</span>
            </div>
            <p style={{ fontSize: "12px", opacity: 0.75, fontFamily: "sans-serif", margin: "0.4rem 0" }}>
              {c.description}
            </p>
            <div style={{ fontSize: "11.5px", fontFamily: "sans-serif", lineHeight: 1.7 }}>
              <div>Garnison : {listerUnites(c.armee)}</div>
              <div style={{ color: couleurs.or }}>Butin : {listerUnites(c.butin)}</div>
              <div>Prestige : {c.experience}</div>
            </div>
            <button style={{ ...style.bouton, marginTop: "0.75rem" }} onClick={() => { setCampChoisi(c); setErreur(""); }}>
              Preparer l'assaut
            </button>
          </div>
        ))}
      </div>

      {/* Historique */}
      {rapports.length > 0 && (
        <>
          <h2 style={{ fontSize: "16px", marginTop: "2rem", color: couleurs.or }}>Rapports de bataille</h2>
          <div style={{ marginTop: "0.5rem" }}>
            {rapports.slice(0, 10).map((r) => (
              <div key={r._id} style={{ ...style.carte, marginBottom: "0.5rem", padding: "0.7rem 1rem" }}>
                <div style={{ fontFamily: "sans-serif", fontSize: "12.5px" }}>
                  <span style={{ color: r.victoire ? couleurs.vertClair : "#E8837A", fontWeight: 700 }}>
                    {r.victoire ? "Victoire" : "Defaite"}
                  </span>
                  {" — "}{r.nomCible}{" — "}{new Date(r.dateCreation).toLocaleString()}
                </div>
                <div style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.75, marginTop: "0.25rem" }}>
                  Pertes : {listerUnites(r.pertesAttaquant)}
                  {r.victoire && ` — Butin : ${listerUnites(r.butin)}`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fenetre de preparation de l'assaut */}
      {campChoisi && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}
          onClick={() => setCampChoisi(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1A1712", borderRadius: "12px", padding: "1.5rem", maxWidth: "420px", width: "100%", border: `1px solid ${couleurs.bronze}`, maxHeight: "90vh", overflowY: "auto" }}
          >
            <h3 style={{ marginTop: 0 }}>Assaut sur {campChoisi.nom}</h3>
            <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.8 }}>
              Garnison ennemie : {listerUnites(campChoisi.armee)}
            </p>

            <h4 style={{ fontSize: "14px", marginBottom: "0.5rem" }}>Troupes a envoyer</h4>
            {unitesDisponibles.length === 0 ? (
              <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#E8837A" }}>
                Aucune troupe en garnison. Forme des unites a la caserne d'abord.
              </p>
            ) : (
              unitesDisponibles.map(([type, dispo]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: "13px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {spriteTroupe(type) && (
                      <img src={spriteTroupe(type)} alt="" style={{ width: "34px", height: "42px", objectFit: "contain" }} />
                    )}
                    <span>{nomsTroupes[type] || type} <span style={{ opacity: 0.6 }}>({dispo})</span></span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={dispo}
                    placeholder="0"
                    value={selection[type] || ""}
                    onChange={(e) => setSelection((s) => ({ ...s, [type]: e.target.value }))}
                    style={style.champ}
                  />
                </div>
              ))
            )}

            {mesHeros.length > 0 && (
              <>
                <h4 style={{ fontSize: "14px", marginTop: "1rem", marginBottom: "0.5rem" }}>Heros (optionnel)</h4>
                <select
                  value={herosChoisi}
                  onChange={(e) => setHerosChoisi(e.target.value)}
                  style={{ ...style.champ, width: "100%" }}
                >
                  <option value="">Aucun heros</option>
                  {mesHeros.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.nom} (niv. {h.niveau}) — {h.specialite}
                    </option>
                  ))}
                </select>
              </>
            )}

            {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
              <button style={style.bouton} disabled={enCours || unitesDisponibles.length === 0} onClick={attaquer}>
                {enCours ? "Bataille en cours..." : "Lancer l'assaut"}
              </button>
              <button style={style.boutonSecondaire} onClick={() => setCampChoisi(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Combat;
