import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const LIBELLE_RANG = {
  roi: "Roi",
  general: "General",
  commandant: "Commandant",
  officier: "Officier",
  membre: "Membre"
};

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
    padding: "0.55rem 1rem",
    color: couleurs.noirProfond,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    fontSize: "13px"
  },
  boutonSecondaire: {
    background: "rgba(227,178,60,0.1)",
    border: "1px solid rgba(227,178,60,0.4)",
    borderRadius: "8px",
    padding: "0.55rem 1rem",
    color: couleurs.orClair,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "Georgia, serif",
    fontSize: "13px"
  },
  carte: {
    background: "rgba(245,233,200,0.05)",
    border: "1px solid rgba(227,178,60,0.3)",
    borderRadius: "10px",
    padding: "1rem",
    marginTop: "1rem"
  },
  champ: {
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(227,178,60,0.35)",
    borderRadius: "6px",
    padding: "0.5rem 0.7rem",
    color: couleurs.orClair,
    fontFamily: "sans-serif",
    fontSize: "13px",
    boxSizing: "border-box"
  }
};

function Alliance() {
  const [donnees, setDonnees] = useState(null);
  const [annuaire, setAnnuaire] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);

  const [formCreation, setFormCreation] = useState({ nom: "", tag: "", description: "" });
  const [texteChat, setTexteChat] = useState("");
  const [don, setDon] = useState({ ressource: "ble", quantite: "" });
  const finChatRef = useRef(null);

  function charger() {
    return Promise.all([
      apiJoueur.get("/api/alliance/mienne"),
      apiJoueur.get("/api/alliance")
    ]).then(([resMienne, resAnnuaire]) => {
      setDonnees(resMienne.data);
      setAnnuaire(resAnnuaire.data);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
    const rafraichissement = setInterval(charger, 15000);
    return () => clearInterval(rafraichissement);
  }, []);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [donnees?.messages?.length]);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={style.page}>Chargement des alliances...</p>;

  async function action(fn) {
    setErreur("");
    setMessage("");
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

  const alliance = donnees?.alliance;
  const monRang = donnees?.monRang;
  const estChef = monRang === "roi";
  const estGradé = ["roi", "general", "commandant", "officier"].includes(monRang);

  return (
    <div style={style.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={style.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Alliance</h1>
      </div>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {/* ---------- SANS ALLIANCE ---------- */}
      {!alliance && (
        <>
          <div style={style.carte}>
            <h2 style={{ fontSize: "16px", margin: "0 0 0.5rem", color: couleurs.or }}>Fonder une alliance</h2>
            <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.75 }}>
              Cout : {Object.entries(donnees?.coutCreation || {}).map(([r, q]) => `${q} ${r}`).join(", ")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "360px" }}>
              <input
                placeholder="Nom de l'alliance"
                value={formCreation.nom}
                onChange={(e) => setFormCreation({ ...formCreation, nom: e.target.value })}
                style={style.champ}
              />
              <input
                placeholder="Tag (5 caracteres max)"
                maxLength={5}
                value={formCreation.tag}
                onChange={(e) => setFormCreation({ ...formCreation, tag: e.target.value.toUpperCase() })}
                style={style.champ}
              />
              <textarea
                placeholder="Description"
                rows={3}
                value={formCreation.description}
                onChange={(e) => setFormCreation({ ...formCreation, description: e.target.value })}
                style={style.champ}
              />
              <button
                style={style.bouton}
                disabled={enCours}
                onClick={() => action(() => apiJoueur.post("/api/alliance/creer", formCreation))}
              >
                Fonder l'alliance
              </button>
            </div>
          </div>

          <div style={style.carte}>
            <h2 style={{ fontSize: "16px", margin: "0 0 0.5rem", color: couleurs.or }}>
              Alliances existantes ({annuaire.length})
            </h2>
            {annuaire.length === 0 ? (
              <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.7 }}>
                Aucune alliance pour l'instant. Sois le premier a en fonder une.
              </p>
            ) : (
              annuaire.map((a) => (
                <div
                  key={a._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid rgba(227,178,60,0.15)",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <strong>[{a.tag}] {a.nom}</strong>
                    <div style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.7 }}>
                      {a.nbMembres}/{a.membresMax} membres
                      {a.prestigeMinimum > 0 && ` — prestige min. ${a.prestigeMinimum}`}
                      {!a.adhesionLibre && " — sur invitation"}
                    </div>
                    {a.description && (
                      <div style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.6, marginTop: "0.2rem" }}>
                        {a.description}
                      </div>
                    )}
                  </div>
                  {a.adhesionLibre && (
                    <button
                      style={style.bouton}
                      disabled={enCours}
                      onClick={() => action(() => apiJoueur.post(`/api/alliance/${a._id}/rejoindre`))}
                    >
                      Rejoindre
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ---------- AVEC ALLIANCE ---------- */}
      {alliance && (
        <>
          <div style={style.carte}>
            <h2 style={{ fontSize: "18px", margin: 0 }}>[{alliance.tag}] {alliance.nom}</h2>
            <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.8, margin: "0.4rem 0" }}>
              {alliance.description || "Aucune description."}
            </p>
            <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", margin: 0 }}>
              {alliance.membres.length}/{alliance.membresMax} membres — ton rang : <strong>{LIBELLE_RANG[monRang]}</strong>
            </p>
          </div>

          {/* Coffre et dons */}
          <div style={style.carte}>
            <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Coffre de l'alliance</h3>
            <p style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
              {Object.entries(alliance.coffre || {})
                .filter(([k]) => k !== "_id")
                .map(([r, q]) => `${q} ${r}`)
                .join(" · ")}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.5rem" }}>
              <select
                value={don.ressource}
                onChange={(e) => setDon({ ...don, ressource: e.target.value })}
                style={style.champ}
              >
                {(donnees.ressourcesDonnables || []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Quantite"
                value={don.quantite}
                onChange={(e) => setDon({ ...don, quantite: e.target.value })}
                style={{ ...style.champ, width: "120px" }}
              />
              <button
                style={style.bouton}
                disabled={enCours}
                onClick={() =>
                  action(() =>
                    apiJoueur.post("/api/alliance/donner", {
                      ressource: don.ressource,
                      quantite: Number(don.quantite)
                    })
                  ).then(() => setDon({ ...don, quantite: "" }))
                }
              >
                Faire un don
              </button>
            </div>
          </div>

          {/* Membres */}
          <div style={style.carte}>
            <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Membres</h3>
            {alliance.membres.map((m) => (
              <div
                key={m.joueur?._id || m._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(227,178,60,0.12)",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
                  <strong>{m.joueur?.nom || "Inconnu"}</strong>
                  <span style={{ opacity: 0.7 }}> — {LIBELLE_RANG[m.rang]}</span>
                  <div style={{ fontSize: "11.5px", opacity: 0.6 }}>
                    Prestige {m.joueur?.pointsPrestige ?? 0} — contribution {m.contribution}
                  </div>
                </div>

                {estGradé && String(m.joueur?._id) !== String(alliance.chef) && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const rang = e.target.value;
                        e.target.value = "";
                        action(() =>
                          apiJoueur.post(`/api/alliance/membre/${m.joueur._id}/rang`, { rang })
                        );
                      }}
                      style={{ ...style.champ, padding: "0.35rem" }}
                    >
                      <option value="">Changer le rang</option>
                      {(donnees.rangs || []).map((r) => (
                        <option key={r} value={r}>{LIBELLE_RANG[r]}</option>
                      ))}
                    </select>
                    <button
                      style={style.boutonSecondaire}
                      disabled={enCours}
                      onClick={() =>
                        action(() => apiJoueur.post(`/api/alliance/membre/${m.joueur._id}/exclure`))
                      }
                    >
                      Exclure
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat */}
          <div style={style.carte}>
            <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Chat d'alliance</h3>
            <div
              style={{
                maxHeight: "260px",
                overflowY: "auto",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                padding: "0.75rem",
                fontFamily: "sans-serif",
                fontSize: "13px"
              }}
            >
              {(donnees.messages || []).length === 0 && (
                <p style={{ opacity: 0.6, margin: 0 }}>Aucun message pour l'instant.</p>
              )}
              {(donnees.messages || []).map((msg) => (
                <div key={msg._id} style={{ marginBottom: "0.45rem" }}>
                  <span style={{ color: msg.systeme ? couleurs.bronze : couleurs.or }}>
                    {msg.systeme ? "" : `${msg.nomAuteur} : `}
                  </span>
                  <span style={{ opacity: msg.systeme ? 0.7 : 1, fontStyle: msg.systeme ? "italic" : "normal" }}>
                    {msg.contenu}
                  </span>
                </div>
              ))}
              <div ref={finChatRef} />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input
                placeholder="Ecris un message..."
                value={texteChat}
                maxLength={500}
                onChange={(e) => setTexteChat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && texteChat.trim()) {
                    action(() => apiJoueur.post("/api/alliance/message", { contenu: texteChat }))
                      .then(() => setTexteChat(""));
                  }
                }}
                style={{ ...style.champ, flex: 1 }}
              />
              <button
                style={style.bouton}
                disabled={enCours || !texteChat.trim()}
                onClick={() =>
                  action(() => apiJoueur.post("/api/alliance/message", { contenu: texteChat }))
                    .then(() => setTexteChat(""))
                }
              >
                Envoyer
              </button>
            </div>
          </div>

          {/* Parametres et depart */}
          <div style={style.carte}>
            {["roi", "general"].includes(monRang) && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Parametres</h3>
                <label style={{ fontFamily: "sans-serif", fontSize: "13px", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={alliance.adhesionLibre}
                    onChange={(e) =>
                      action(() =>
                        apiJoueur.put("/api/alliance/parametres", { adhesionLibre: e.target.checked })
                      )
                    }
                  />
                  Adhesion libre (sans invitation)
                </label>
              </div>
            )}

            <button
              style={style.boutonSecondaire}
              disabled={enCours}
              onClick={() => {
                if (window.confirm("Quitter definitivement cette alliance ?")) {
                  action(() => apiJoueur.post("/api/alliance/quitter"));
                }
              }}
            >
              {estChef && alliance.membres.length > 1
                ? "Quitter (transmets d'abord la couronne)"
                : "Quitter l'alliance"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Alliance;
