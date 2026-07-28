import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

function Objets() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [onglet, setOnglet] = useState("sac");
  const [quantites, setQuantites] = useState({});

  function charger() {
    return apiJoueur.get("/api/objets").then((res) => {
      setDonnees(res.data);
      setChargement(false);
    });
  }

  useEffect(() => { charger(); }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement du sac...</p>;

  async function acheter(code) {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const { data } = await apiJoueur.post(`/api/objets/${code}/acheter`, {
        quantite: Number(quantites[code]) || 1
      });
      setMessage(data.message);
      setQuantites((q) => ({ ...q, [code]: "" }));
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Achat impossible");
    } finally { setEnCours(false); }
  }

  async function utiliser(code) {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const { data } = await apiJoueur.post(`/api/objets/${code}/utiliser`);
      setMessage(data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Impossible d'utiliser cet objet");
    } finally { setEnCours(false); }
  }

  const protectionActive = donnees.protectionJusquA && new Date(donnees.protectionJusquA) > new Date();

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Sac</h1>
      </div>

      {protectionActive && (
        <div style={{ ...s.carte, borderColor: couleurs.vertClair }}>
          <strong style={{ color: couleurs.vertClair }}>Bouclier actif</strong>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.3rem 0 0" }}>
            Ta cite est protegee jusqu'au {new Date(donnees.protectionJusquA).toLocaleString("fr-FR")}
          </p>
        </div>
      )}

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button style={onglet === "sac" ? s.bouton : s.boutonSecondaire} onClick={() => setOnglet("sac")}>
          Mon sac ({donnees.objets.length})
        </button>
        <button style={onglet === "boutique" ? s.bouton : s.boutonSecondaire} onClick={() => setOnglet("boutique")}>
          Boutique ({donnees.or} 💎)
        </button>
        <button style={onglet === "catalogue" ? s.bouton : s.boutonSecondaire} onClick={() => setOnglet("catalogue")}>
          Tous les objets
        </button>
      </div>

      {onglet === "sac" && donnees.objets.length === 0 && (
        <div style={s.carte}>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.75, margin: 0 }}>
            Ton sac est vide. Les objets s'obtiennent par les quetes, les evenements,
            la boutique, ou en cadeau de l'administration.
          </p>
        </div>
      )}

      {Object.entries(donnees.categories).map(([cle, cat]) => {
        const source = onglet === "sac" ? donnees.objets
          : onglet === "boutique" ? donnees.boutique
          : donnees.catalogue;
        const liste = source.filter((o) => o.categorie === cle);
        if (liste.length === 0) return null;

        return (
          <div key={cle} style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 0.25rem", color: cat.couleur }}>{cat.nom}</h2>
            <div style={s.grille}>
              {liste.map((o) => (
                <div key={o.code} style={{ ...s.carte, marginTop: 0, borderColor: cat.couleur }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <strong style={{ fontSize: "14px" }}>
                      <span style={{ fontSize: "18px", marginRight: "0.35rem" }}>{o.icone}</span>
                      {o.nom}
                    </strong>
                    {onglet === "sac" && (
                      <span style={{ color: couleurs.or, fontWeight: 700 }}>x{o.quantite}</span>
                    )}
                    {onglet === "boutique" && (
                      <span style={{ color: couleurs.or, fontWeight: 700, whiteSpace: "nowrap" }}>{o.prixOr} 💎</span>
                    )}
                  </div>
                  <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.75, margin: "0.35rem 0" }}>
                    {o.description}
                  </p>
                  {onglet === "sac" && (
                    <button style={s.bouton} disabled={enCours} onClick={() => utiliser(o.code)}>
                      Utiliser
                    </button>
                  )}
                  {onglet === "boutique" && (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <input type="number" min="1" max="99" placeholder="1"
                        value={quantites[o.code] || ""}
                        onChange={(e) => setQuantites({ ...quantites, [o.code]: e.target.value })}
                        style={{ ...s.champ, width: "62px" }} />
                      <button style={s.bouton} disabled={enCours} onClick={() => acheter(o.code)}>
                        Acheter
                      </button>
                    </div>
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

export default Objets;
