import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const LIBELLE_STAT = {
  attaque: "Attaque",
  defense: "Defense",
  sante: "Vie",
  leadership: "Leadership",
  vitesse: "Vitesse"
};

function Inventaire() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState("tous");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  function charger() {
    return apiJoueur.get("/api/inventaire").then((res) => {
      setDonnees(res.data);
      setChargement(false);
    });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement de l'inventaire...</p>;

  async function action(fn) {
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const res = await fn();
      if (res?.data?.message) setMessage(res.data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Une erreur est survenue");
    } finally {
      setEnCours(false);
    }
  }

  function nomHeros(id) {
    return donnees.heros.find((h) => String(h._id) === String(id))?.nom || "un heros";
  }

  const objetsFiltres = filtre === "tous"
    ? donnees.objets
    : donnees.objets.filter((o) => o.emplacement === filtre);

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Forge et inventaire</h1>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75 }}>
        Forge niveau {donnees.niveauForge} — une forge plus haute ameliore les chances d'obtenir des raretes elevees
      </p>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {/* Fabrication */}
      <div style={s.carte}>
        <strong style={{ color: couleurs.or }}>Fabriquer un equipement</strong>
        <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75, margin: "0.4rem 0" }}>
          Cout : {Object.entries(donnees.coutFabrication).map(([r, q]) => `${q} ${r}`).join(", ")}
        </p>
        <button
          style={s.bouton}
          disabled={enCours || donnees.niveauForge < 1}
          onClick={() => action(() => apiJoueur.post("/api/inventaire/fabriquer"))}
        >
          {enCours ? "Fabrication..." : "Forger un objet"}
        </button>
      </div>

      {/* Filtres par emplacement */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
        <button style={filtre === "tous" ? s.bouton : s.boutonSecondaire} onClick={() => setFiltre("tous")}>
          Tous ({donnees.objets.length})
        </button>
        {Object.entries(donnees.emplacements).map(([cle, nom]) => (
          <button key={cle} style={filtre === cle ? s.bouton : s.boutonSecondaire} onClick={() => setFiltre(cle)}>
            {nom}
          </button>
        ))}
      </div>

      {objetsFiltres.length === 0 ? (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.75, margin: 0 }}>
            Aucun objet dans cette categorie. Forge ton premier equipement ci-dessus.
          </p>
        </div>
      ) : (
        <div style={s.grille}>
          {objetsFiltres.map((o) => {
            const couleurRarete = donnees.raretes[o.rarete]?.couleur || couleurs.orClair;
            return (
              <div key={o._id} style={{ ...s.carte, marginTop: 0, borderColor: couleurRarete }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "15px" }}>{o.nom}</strong>
                  <span style={{ fontSize: "11px", color: couleurRarete, textTransform: "uppercase" }}>
                    {donnees.raretes[o.rarete]?.nom || o.rarete}
                  </span>
                </div>

                <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.7, margin: "0.3rem 0" }}>
                  {donnees.emplacements[o.emplacement]} — {o.description}
                </p>

                <div style={{ fontFamily: "sans-serif", fontSize: "12px", lineHeight: 1.7 }}>
                  {Object.entries(o.stats || {}).map(([cle, valeur]) => (
                    <div key={cle}>+{valeur} {LIBELLE_STAT[cle] || cle}</div>
                  ))}
                </div>

                {o.equipeSur ? (
                  <>
                    <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: couleurs.vertClair, margin: "0.5rem 0 0.4rem" }}>
                      Equipe sur {nomHeros(o.equipeSur)}
                    </p>
                    <button
                      style={s.boutonSecondaire}
                      disabled={enCours}
                      onClick={() => action(() => apiJoueur.post(`/api/inventaire/${o._id}/retirer`))}
                    >
                      Retirer
                    </button>
                  </>
                ) : donnees.heros.length === 0 ? (
                  <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.65, margin: "0.5rem 0 0" }}>
                    Recrute un heros pour equiper cet objet.
                  </p>
                ) : (
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const herosId = e.target.value;
                        e.target.value = "";
                        action(() => apiJoueur.post(`/api/inventaire/${o._id}/equiper`, { herosId }));
                      }}
                      style={{ ...s.champ, padding: "0.4rem" }}
                    >
                      <option value="">Equiper sur...</option>
                      {donnees.heros.map((h) => (
                        <option key={h._id} value={h._id}>{h.nom} (niv. {h.niveau})</option>
                      ))}
                    </select>
                    <button
                      style={s.boutonSecondaire}
                      disabled={enCours}
                      onClick={() => {
                        if (window.confirm("Recycler cet objet contre des ressources ?")) {
                          action(() => apiJoueur.delete(`/api/inventaire/${o._id}`));
                        }
                      }}
                    >
                      Recycler
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Inventaire;
