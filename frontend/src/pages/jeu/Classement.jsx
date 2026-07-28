import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const ONGLETS = [
  { cle: "puissance", nom: "Puissance", champ: "puissance" },
  { cle: "armee", nom: "Armee", champ: "scoreArmee" },
  { cle: "heros", nom: "Heros", champ: "scoreHeros" },
  { cle: "conquete", nom: "Conquete", champ: "prestige" },
  { cle: "richesse", nom: "Richesse", champ: "scoreRichesse" }
];

function Classement() {
  const [donnees, setDonnees] = useState(null);
  const [alliances, setAlliances] = useState([]);
  const [onglet, setOnglet] = useState("puissance");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([
      apiJoueur.get("/api/classement"),
      apiJoueur.get("/api/classement/alliances")
    ]).then(([res1, res2]) => {
      setDonnees(res1.data);
      setAlliances(res2.data);
      setChargement(false);
    });
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement des classements...</p>;

  const ongletActif = ONGLETS.find((o) => o.cle === onglet);
  const liste = onglet === "alliances" ? alliances : donnees[onglet] || [];

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Classements</h1>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75 }}>
        {donnees.totalJoueurs} souverains sur le continent
      </p>

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            style={onglet === o.cle ? s.bouton : s.boutonSecondaire}
            onClick={() => setOnglet(o.cle)}
          >
            {o.nom}
          </button>
        ))}
        <button
          style={onglet === "alliances" ? s.bouton : s.boutonSecondaire}
          onClick={() => setOnglet("alliances")}
        >
          Alliances
        </button>
      </div>

      {onglet !== "alliances" && donnees.maPosition?.[ongletActif.champ] > 0 && (
        <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.or, marginTop: "0.75rem" }}>
          Ta position : {donnees.maPosition[ongletActif.champ]} / {donnees.totalJoueurs}
        </p>
      )}

      <div style={s.carte}>
        {liste.length === 0 ? (
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.7 }}>
            Aucun classement disponible pour l'instant.
          </p>
        ) : (
          liste.map((entree) => (
            <div key={entree._id} style={s.ligne}>
              <div>
                <span style={{ color: entree.position <= 3 ? couleurs.or : couleurs.orClair, fontWeight: 700 }}>
                  #{entree.position}
                </span>
                {"  "}
                <strong>
                  {entree.tag ? `[${entree.tag}] ` : ""}{entree.nom}
                </strong>
                {entree.alliance && (
                  <span style={{ opacity: 0.65 }}> [{entree.alliance.tag}]</span>
                )}
                <div style={{ fontSize: "11.5px", opacity: 0.65 }}>
                  {onglet === "alliances"
                    ? `${entree.nbMembres} membres — tresor ${entree.tresor}`
                    : `${entree.rang} — ${entree.nbHeros} heros — ${entree.nbVilles} cite(s)`}
                </div>
              </div>
              <strong style={{ color: couleurs.or }}>
                {onglet === "alliances"
                  ? entree.puissance.toLocaleString()
                  : (entree[ongletActif.champ] || 0).toLocaleString()}
              </strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Classement;
