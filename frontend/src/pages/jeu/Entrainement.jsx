import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { formaterDuree } from "../../data/batiments";
import { spriteTroupe } from "../../data/sprites";

const CATEGORIES = [
  { code: "logistique", nom: "Logistique" },
  { code: "reconnaissance", nom: "Reconnaissance" },
  { code: "sol", nom: "Troupes au sol" },
  { code: "distance", nom: "Troupes a distance" },
  { code: "monte", nom: "Troupes montees" },
  { code: "siege", nom: "Engins de siege" }
];

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
    border: `1px solid rgba(227,178,60,0.4)`,
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
    width: "80px",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(227,178,60,0.35)",
    borderRadius: "6px",
    padding: "0.4rem 0.5rem",
    color: couleurs.orClair,
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  }
};

function Entrainement() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [quantites, setQuantites] = useState({});
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [maintenant, setMaintenant] = useState(Date.now());

  function charger() {
    return apiJoueur.get("/api/troupes").then((res) => {
      setDonnees(res.data);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
    const rafraichissement = setInterval(charger, 15000);
    const tick = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => {
      clearInterval(rafraichissement);
      clearInterval(tick);
    };
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={style.page}>Chargement de la caserne...</p>;

  async function entrainer(type) {
    const quantite = Number(quantites[type] || 0);
    if (quantite <= 0) {
      setErreur("Indique une quantite superieure a zero");
      return;
    }
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/troupes/entrainer", { type, quantite });
      setMessage(data.message);
      setQuantites((q) => ({ ...q, [type]: "" }));
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de l'entrainement");
    } finally {
      setEnCours(false);
    }
  }

  const totalArmee = Object.values(donnees.armee || {}).reduce((a, b) => a + b, 0);

  return (
    <div style={style.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={style.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Caserne</h1>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.8 }}>
        Caserne niveau {donnees.niveauCaserne} — palier {donnees.palier} ({donnees.palierNom}) —
        jusqu'a {donnees.capaciteLot} unites par lot — armee totale : {totalArmee}
      </p>
      <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", color: donnees.populationUtilisee >= donnees.populationMax ? "#E8837A" : couleurs.vertClair }}>
        Population : {donnees.populationUtilisee} / {donnees.populationMax}
        {donnees.populationUtilisee >= donnees.populationMax && " — construis des Habitations pour loger plus de troupes"}
      </p>

      {/* File d'entrainement en cours */}
      {donnees.fileEntrainement?.length > 0 && (
        <div style={{ ...style.carte, marginTop: "1rem" }}>
          <strong>Entrainement en cours</strong>
          {donnees.fileEntrainement.map((lot, i) => {
            const restant = Math.max(0, Math.round((new Date(lot.finEntrainement).getTime() - maintenant) / 1000));
            return (
              <p key={i} style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.4rem 0", color: couleurs.vertClair }}>
                {lot.quantite} {donnees.types.find((t) => t.code === lot.type)?.nom || lot.type} — pret dans {formaterDuree(restant)}
              </p>
            );
          })}
        </div>
      )}

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif" }}>{erreur}</p>}

      {CATEGORIES.map((cat) => {
        const unites = donnees.types.filter((t) => t.categorie === cat.code);
        if (unites.length === 0) return null;

        return (
          <div key={cat.code} style={{ marginTop: "1.75rem" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 0.25rem", color: couleurs.or }}>{cat.nom}</h2>
            <div style={style.grille}>
              {unites.map((t) => (
                <div key={t.code} style={{ ...style.carte, opacity: t.debloque ? 1 : 0.5 }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    {spriteTroupe(t.code) && (
                      <img
                        src={spriteTroupe(t.code)}
                        alt=""
                        style={{ width: "64px", height: "84px", objectFit: "contain", flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "16px" }}>{t.nom}</strong>
                        <span style={{ fontSize: "13px", color: couleurs.or }}>
                          {donnees.armee?.[t.code] ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", opacity: 0.75, fontFamily: "sans-serif", margin: "0.4rem 0" }}>
                    {t.description}
                  </p>

                  <div style={{ fontSize: "11.5px", fontFamily: "sans-serif", lineHeight: 1.7, margin: "0.4rem 0" }}>
                    <div>Attaque {t.stats.attaque} · Defense {t.stats.defense} · Vie {t.stats.sante}</div>
                    <div>Vitesse {t.stats.vitesse} · Portee {t.stats.portee} · Charge {t.stats.charge}</div>
                    <div>Entretien {t.stats.entretien} · Population {t.stats.population}</div>
                    <div style={{ color: couleurs.or }}>Puissance {t.stats.puissance}</div>
                  </div>

                  {(t.fort || t.faible) && (
                    <p style={{ fontSize: "11px", fontFamily: "sans-serif", margin: "0.4rem 0" }}>
                      {t.fort && (
                        <span style={{ color: couleurs.vertClair }}>
                          Fort contre {donnees.types.find((x) => x.code === t.fort)?.nom || t.fort}
                        </span>
                      )}
                      {t.fort && t.faible && " · "}
                      {t.faible && (
                        <span style={{ color: "#E8837A" }}>
                          Faible contre {donnees.types.find((x) => x.code === t.faible)?.nom || t.faible}
                        </span>
                      )}
                    </p>
                  )}

                  <p style={{ fontSize: "11px", opacity: 0.7, fontFamily: "sans-serif", margin: "0.4rem 0" }}>
                    Cout par unite : {Object.entries(t.coutUnitaire).map(([r, v]) => `${v} ${r}`).join(", ")}
                  </p>

                  {t.debloque ? (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center" }}>
                      <input
                        type="number"
                        min="1"
                        max={donnees.capaciteLot}
                        placeholder="Nb"
                        value={quantites[t.code] || ""}
                        onChange={(e) => setQuantites((q) => ({ ...q, [t.code]: e.target.value }))}
                        style={style.champ}
                      />
                      <button style={style.bouton} disabled={enCours} onClick={() => entrainer(t.code)}>
                        Former
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: "11.5px", color: "#E8837A", fontFamily: "sans-serif", marginTop: "0.75rem" }}>
                      Necessite le batiment : {t.batimentRequis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Entrainement;
