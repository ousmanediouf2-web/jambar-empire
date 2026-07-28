import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { styleJeu as s } from "../../stylesJeu";

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

function Messages() {
  const [recus, setRecus] = useState([]);
  const [envoyes, setEnvoyes] = useState([]);
  const [nonLus, setNonLus] = useState(0);
  const [onglet, setOnglet] = useState("recus");
  const [ouvert, setOuvert] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [redaction, setRedaction] = useState({ nomDestinataire: "", sujet: "", contenu: "" });

  function charger() {
    return Promise.all([
      apiJoueur.get("/api/messages/recus"),
      apiJoueur.get("/api/messages/envoyes")
    ]).then(([res1, res2]) => {
      setRecus(res1.data.messages || []);
      setNonLus(res1.data.nonLus || 0);
      setEnvoyes(res2.data || []);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
    const rafraichissement = setInterval(charger, 20000);
    return () => clearInterval(rafraichissement);
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={s.page}>Chargement de la messagerie...</p>;

  async function envoyer() {
    setMessage("");
    setErreur("");
    setEnCours(true);
    try {
      const { data } = await apiJoueur.post("/api/messages/envoyer", redaction);
      setMessage(data.message);
      setRedaction({ nomDestinataire: "", sujet: "", contenu: "" });
      setOnglet("envoyes");
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de l'envoi");
    } finally {
      setEnCours(false);
    }
  }

  async function ouvrir(msg) {
    setOuvert(msg);
    if (onglet === "recus" && !msg.lu) {
      await apiJoueur.put(`/api/messages/${msg._id}/lu`);
      charger();
    }
  }

  async function supprimer(id) {
    await apiJoueur.delete(`/api/messages/${id}`);
    setOuvert(null);
    charger();
  }

  const liste = onglet === "recus" ? recus : envoyes;

  return (
    <div style={s.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={s.boutonSecondaire}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "22px" }}>Messages</h1>
      </div>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button style={onglet === "recus" ? s.bouton : s.boutonSecondaire} onClick={() => { setOnglet("recus"); setOuvert(null); }}>
          Recus {nonLus > 0 && `(${nonLus})`}
        </button>
        <button style={onglet === "envoyes" ? s.bouton : s.boutonSecondaire} onClick={() => { setOnglet("envoyes"); setOuvert(null); }}>
          Envoyes
        </button>
        <button style={onglet === "redaction" ? s.bouton : s.boutonSecondaire} onClick={() => { setOnglet("redaction"); setOuvert(null); }}>
          Nouveau message
        </button>
      </div>

      {/* Redaction */}
      {onglet === "redaction" && (
        <div style={s.carte}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxWidth: "460px" }}>
            <input
              placeholder="Nom du souverain destinataire"
              value={redaction.nomDestinataire}
              onChange={(e) => setRedaction({ ...redaction, nomDestinataire: e.target.value })}
              style={s.champ}
            />
            <input
              placeholder="Sujet"
              maxLength={120}
              value={redaction.sujet}
              onChange={(e) => setRedaction({ ...redaction, sujet: e.target.value })}
              style={s.champ}
            />
            <textarea
              placeholder="Ton message..."
              rows={6}
              maxLength={2000}
              value={redaction.contenu}
              onChange={(e) => setRedaction({ ...redaction, contenu: e.target.value })}
              style={s.champ}
            />
            <button style={s.bouton} disabled={enCours} onClick={envoyer}>
              {enCours ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {onglet !== "redaction" && (
        <div style={s.carte}>
          {liste.length === 0 ? (
            <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.7, margin: 0 }}>
              Aucun message.
            </p>
          ) : (
            liste.map((m) => (
              <div
                key={m._id}
                style={{ ...s.ligne, cursor: "pointer" }}
                onClick={() => ouvrir(m)}
              >
                <div>
                  <strong style={{ color: onglet === "recus" && !m.lu ? couleurs.or : couleurs.orClair }}>
                    {m.sujet}
                  </strong>
                  <div style={{ fontSize: "11.5px", opacity: 0.65 }}>
                    {onglet === "recus" ? `De ${m.nomExpediteur}` : `A ${m.nomDestinataire}`}
                    {" — "}{new Date(m.dateCreation).toLocaleString()}
                  </div>
                </div>
                {onglet === "recus" && !m.lu && (
                  <span style={{ color: couleurs.or, fontSize: "11px" }}>Non lu</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Message ouvert */}
      {ouvert && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setOuvert(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1A1712", borderRadius: "12px", padding: "1.5rem", maxWidth: "500px", width: "100%", border: `1px solid ${couleurs.bronze}`, maxHeight: "85vh", overflowY: "auto" }}
          >
            <h3 style={{ margin: "0 0 0.35rem" }}>{ouvert.sujet}</h3>
            <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.65, margin: "0 0 1rem" }}>
              {onglet === "recus" ? `De ${ouvert.nomExpediteur}` : `A ${ouvert.nomDestinataire}`}
              {" — "}{new Date(ouvert.dateCreation).toLocaleString()}
            </p>
            <p style={{ fontFamily: "sans-serif", fontSize: "13.5px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {ouvert.contenu}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              {onglet === "recus" && (
                <button
                  style={s.bouton}
                  onClick={() => {
                    setRedaction({ nomDestinataire: ouvert.nomExpediteur, sujet: `Re: ${ouvert.sujet}`, contenu: "" });
                    setOuvert(null);
                    setOnglet("redaction");
                  }}
                >
                  Repondre
                </button>
              )}
              <button style={s.boutonSecondaire} onClick={() => supprimer(ouvert._id)}>Supprimer</button>
              <button style={s.boutonSecondaire} onClick={() => setOuvert(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages;
