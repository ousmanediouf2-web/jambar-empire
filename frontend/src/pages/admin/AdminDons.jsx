import { useEffect, useState } from "react";
import api from "../../services/api";
import { couleurs } from "../../theme";

const RESSOURCES_LABEL = {
  ble: "Nourriture", bois: "Bois", pierre: "Pierre",
  fer: "Fer", argent: "Argent", or: "Gemmes (or)"
};

function AdminDons() {
  const [cat, setCat] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [joueurs, setJoueurs] = useState([]);
  const [cible, setCible] = useState(null);

  const [ressources, setRessources] = useState({});
  const [objets, setObjets] = useState({});
  const [heros, setHeros] = useState([]);
  const [troupes, setTroupes] = useState({});
  const [sujet, setSujet] = useState("Un present du royaume");
  const [texte, setTexte] = useState("");

  const [annonce, setAnnonce] = useState({ sujet: "Annonce du royaume", contenu: "" });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    api.get("/api/admin/dons/catalogue").then((r) => setCat(r.data));
    chercher("");
  }, []);

  function chercher(q) {
    api.get(`/api/admin/dons/joueurs?q=${encodeURIComponent(q)}`).then((r) => setJoueurs(r.data));
  }

  async function offrir() {
    if (!cible) { setErreur("Choisis un joueur"); return; }
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const listeObjets = Object.entries(objets)
        .filter(([, q]) => Number(q) > 0)
        .map(([code, q]) => ({ code, quantite: Number(q) }));

      const { data } = await api.post("/api/admin/dons/offrir", {
        joueurId: cible._id,
        ressources: Object.fromEntries(
          Object.entries(ressources).filter(([, v]) => Number(v) !== 0)
            .map(([k, v]) => [k, Number(v)])
        ),
        objets: listeObjets,
        heros,
        troupes: Object.fromEntries(
          Object.entries(troupes).filter(([, v]) => Number(v) !== 0).map(([k, v]) => [k, Number(v)])
        ),
        sujet,
        messagePersonnalise: texte
      });
      setMessage(`${data.message} — ${data.recapitulatif.join(", ")}`);
      setRessources({}); setObjets({}); setHeros([]); setTroupes({}); setTexte("");
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de l'envoi");
    } finally { setEnCours(false); }
  }

  async function envoyerAnnonce() {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const { data } = await api.post("/api/admin/dons/annonce", annonce);
      setMessage(data.message);
      setAnnonce({ ...annonce, contenu: "" });
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur lors de l'annonce");
    } finally { setEnCours(false); }
  }

  const st = {
    carte: { background: "rgba(245,233,200,0.05)", border: `1px solid ${couleurs.bronze}`, borderRadius: "10px", padding: "1rem", marginBottom: "1rem" },
    champ: { background: "rgba(0,0,0,0.4)", border: `1px solid rgba(227,178,60,0.35)`, borderRadius: "6px", padding: "0.45rem 0.6rem", color: couleurs.orClair, fontFamily: "sans-serif", fontSize: "13px", boxSizing: "border-box" },
    bouton: { background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`, border: "none", borderRadius: "8px", padding: "0.5rem 1rem", color: couleurs.noirProfond, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px" },
    sec: { background: "rgba(227,178,60,0.12)", border: `1px solid rgba(227,178,60,0.4)`, borderRadius: "8px", padding: "0.4rem 0.8rem", color: couleurs.orClair, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "12.5px" }
  };

  if (!cat) return <p>Chargement...</p>;

  return (
    <div>
      <h1 style={{ fontSize: "20px", marginTop: 0 }}>Dons et annonces</h1>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      {/* Choix du joueur */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>1. Choisir le beneficiaire</h3>
        <input
          placeholder="Chercher un joueur par son nom"
          value={recherche}
          onChange={(e) => { setRecherche(e.target.value); chercher(e.target.value); }}
          style={{ ...st.champ, width: "100%", maxWidth: "320px" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
          {joueurs.map((j) => (
            <button key={j._id}
              style={cible?._id === j._id ? st.bouton : st.sec}
              onClick={() => setCible(j)}>
              {j.nom} ({j.rang})
            </button>
          ))}
        </div>
        {cible && (
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.vertClair, marginTop: "0.6rem" }}>
            Beneficiaire : {cible.nom}
          </p>
        )}
      </div>

      {/* Ressources */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>2. Ressources et gemmes</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.6rem" }}>
          {cat.ressources.map((r) => (
            <label key={r} style={{ fontFamily: "sans-serif", fontSize: "12.5px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {RESSOURCES_LABEL[r] || r}
              <input type="number" placeholder="0" value={ressources[r] || ""}
                onChange={(e) => setRessources({ ...ressources, [r]: e.target.value })}
                style={st.champ} />
            </label>
          ))}
        </div>
        <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.65, marginTop: "0.5rem" }}>
          Une valeur negative retire des ressources.
        </p>
      </div>

      {/* Objets */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>3. Objets</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem", maxHeight: "260px", overflowY: "auto" }}>
          {cat.objets.map((o) => (
            <label key={o.code} style={{ fontFamily: "sans-serif", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "space-between" }}>
              <span>{o.nom}</span>
              <input type="number" min="0" placeholder="0" value={objets[o.code] || ""}
                onChange={(e) => setObjets({ ...objets, [o.code]: e.target.value })}
                style={{ ...st.champ, width: "70px" }} />
            </label>
          ))}
        </div>
      </div>

      {/* Heros */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>4. Heros</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {cat.heros.map((h) => (
            <button key={h.code}
              style={heros.includes(h.code) ? st.bouton : st.sec}
              onClick={() => setHeros((l) => l.includes(h.code) ? l.filter((c) => c !== h.code) : [...l, h.code])}>
              {h.nom} ({h.rarete})
            </button>
          ))}
        </div>
      </div>

      {/* Troupes */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>4 bis. Troupes</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
          {(cat.troupes || []).map((t) => (
            <label key={t.code} style={{ fontFamily: "sans-serif", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "space-between" }}>
              <span>{t.nom}</span>
              <input type="number" placeholder="0" value={troupes[t.code] || ""}
                onChange={(e) => setTroupes({ ...troupes, [t.code]: e.target.value })}
                style={{ ...st.champ, width: "80px" }} />
            </label>
          ))}
        </div>
        <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.65, marginTop: "0.5rem" }}>
          Une valeur negative retire des troupes de la garnison.
        </p>
      </div>

      {/* Message */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>5. Message d'accompagnement</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "500px" }}>
          <input placeholder="Sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} style={st.champ} />
          <textarea rows={3} placeholder="Mot personnalise (optionnel)" value={texte}
            onChange={(e) => setTexte(e.target.value)} style={st.champ} />
          <button style={st.bouton} disabled={enCours || !cible} onClick={offrir}>
            {enCours ? "Envoi..." : "Envoyer le don"}
          </button>
        </div>
        <p style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.65, marginTop: "0.5rem" }}>
          Le joueur recoit un message recapitulant tout ce qui lui a ete offert.
        </p>
      </div>

      {/* Annonce globale */}
      <div style={st.carte}>
        <h3 style={{ fontSize: "15px", margin: "0 0 0.5rem", color: couleurs.or }}>Annonce a tous les joueurs</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "500px" }}>
          <input placeholder="Sujet" value={annonce.sujet}
            onChange={(e) => setAnnonce({ ...annonce, sujet: e.target.value })} style={st.champ} />
          <textarea rows={3} placeholder="Ton annonce" value={annonce.contenu}
            onChange={(e) => setAnnonce({ ...annonce, contenu: e.target.value })} style={st.champ} />
          <button style={st.bouton} disabled={enCours || !annonce.contenu.trim()} onClick={envoyerAnnonce}>
            Envoyer l'annonce
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDons;
