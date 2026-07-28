import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";
import { formaterDuree } from "../../data/batiments";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const LIBELLE_EFFET = {
  production_argent: "production d'argent",
  production_ble: "production de nourriture",
  production_bois: "production de bois",
  production_pierre: "production de pierre",
  production_fer: "production de fer",
  capacite_stockage: "capacite de stockage",
  charge: "capacite de transport",
  butin: "butin de raid",
  attaque: "attaque des troupes",
  defense: "defense des troupes",
  sante: "vie des troupes",
  attaque_siege: "attaque des engins de siege",
  defense_cite: "defense de la cite",
  vitesse_marche: "vitesse des armees",
  vitesse_entrainement: "vitesse de formation",
  vitesse_construction: "vitesse de construction",
  cout_construction: "reduction du cout de construction",
  heros_attaque: "attaque apportee par les heros",
  heros_defense: "defense apportee par les heros",
  experience_heros: "experience des heros"
};

function Recherche() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [categorie, setCategorie] = useState("toutes");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());

  function charger() {
    return apiJoueur.get("/api/recherche").then((res) => {
      setDonnees(res.data);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
    const rafraichissement = setInterval(charger, 15000);
    const tick = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => { clearInterval(rafraichissement); clearInterval(tick); };
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement de l'Academie...</p>;

  async function lancer(code) {
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post(`/api/recherche/${code}/lancer`);
      setMessage(data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors du lancement");
    } finally {
      setEnCours(false);
    }
  }

  const rechercheEnCours = donnees.technologies.find((t) => t.finRecherche);
  const listeFiltree = categorie === "toutes"
    ? donnees.technologies
    : donnees.technologies.filter((t) => t.categorie === categorie);

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Academie</h1>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75 }}>
        Academie niveau {donnees.niveauAcademie} — une seule recherche a la fois dans tout l'empire
      </p>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {rechercheEnCours && (
        <div style={{ ...s.carte, borderColor: couleurs.vertClair }}>
          <strong style={{ color: couleurs.vertClair }}>Recherche en cours</strong>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.35rem 0 0" }}>
            {rechercheEnCours.nom} niveau {rechercheEnCours.niveau + 1} — pret dans{" "}
            {formaterDuree(Math.max(0, Math.round((new Date(rechercheEnCours.finRecherche).getTime() - maintenant) / 1000)))}
          </p>
        </div>
      )}

      {/* Bonus cumules */}
      {Object.keys(donnees.bonus || {}).length > 0 && (
        <div style={s.carte}>
          <strong style={{ color: couleurs.or }}>Bonus acquis</strong>
          <div style={{ fontFamily: "sans-serif", fontSize: "12.5px", lineHeight: 1.8, marginTop: "0.35rem" }}>
            {Object.entries(donnees.bonus).map(([type, valeur]) => (
              <div key={type}>+{valeur}% {LIBELLE_EFFET[type] || type}</div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres par categorie */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
        <button style={categorie === "toutes" ? s.bouton : s.boutonSecondaire} onClick={() => setCategorie("toutes")}>
          Toutes
        </button>
        {Object.entries(donnees.categories).map(([cle, cat]) => (
          <button
            key={cle}
            style={categorie === cle ? s.bouton : s.boutonSecondaire}
            onClick={() => setCategorie(cle)}
          >
            {cat.nom}
          </button>
        ))}
      </div>

      <div style={s.grille}>
        {listeFiltree.map((t) => {
          const couleurCat = donnees.categories[t.categorie]?.couleur || couleurs.or;
          const maxAtteint = t.niveau >= t.niveauMax;
          const bloque = !t.academieOk || !t.prerequisOk;

          return (
            <div
              key={t.code}
              style={{
                ...s.carte,
                marginTop: 0,
                borderColor: couleurCat,
                opacity: bloque ? 0.55 : 1
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "15px" }}>{t.nom}</strong>
                <span style={{ fontSize: "12px", color: couleurCat }}>
                  {t.niveau}/{t.niveauMax}
                </span>
              </div>

              <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.75, margin: "0.35rem 0" }}>
                {t.description}
              </p>

              {t.niveau > 0 && (
                <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: couleurs.vertClair, margin: "0.25rem 0" }}>
                  Actuel : +{t.bonusActuel}% {LIBELLE_EFFET[t.effet.type] || t.effet.type}
                </p>
              )}

              {!maxAtteint && (
                <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.7, margin: "0.25rem 0" }}>
                  Niveau suivant : +{t.effet.parNiveau}% supplementaires
                </p>
              )}

              {!t.academieOk && (
                <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", color: "#E8837A", margin: "0.25rem 0" }}>
                  Academie niveau {t.academieRequise} requis
                </p>
              )}
              {t.academieOk && !t.prerequisOk && (
                <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", color: "#E8837A", margin: "0.25rem 0" }}>
                  {t.messagePrerequis}
                </p>
              )}

              {maxAtteint ? (
                <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", color: couleurs.or, margin: "0.5rem 0 0" }}>
                  Niveau maximum atteint
                </p>
              ) : (
                <>
                  <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.7, margin: "0.4rem 0" }}>
                    Cout : {Object.entries(t.cout || {}).map(([r, q]) => `${q} ${r}`).join(", ")}
                    {" — "}{formaterDuree(t.dureeSecondes)}
                  </p>
                  <button
                    style={s.bouton}
                    disabled={enCours || bloque || Boolean(rechercheEnCours)}
                    onClick={() => lancer(t.code)}
                  >
                    {t.finRecherche ? "En cours" : "Rechercher"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Recherche;
