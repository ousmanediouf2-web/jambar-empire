import { useEffect, useRef, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { formaterDuree } from "../../data/batiments";

const TERRAIN = {
  vide:     { fond: "#D9C9A3", bord: "#C4B189", nom: "Terrain libre" },
  prairie:  { fond: "#B9CE8A", bord: "#A2BA72", nom: "Prairie (nourriture)" },
  foret:    { fond: "#6E9A63", bord: "#5A8351", nom: "Foret (bois)" },
  lac:      { fond: "#7FB3D5", bord: "#6699BC", nom: "Lac (nourriture)" },
  montagne: { fond: "#9A9086", bord: "#847A70", nom: "Montagne (fer)" },
  colline:  { fond: "#C8A87E", bord: "#B08F66", nom: "Colline (pierre)" }
};

const PAS = 20;          // taille d'une case dans le monde
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 3;

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

const st = {
  page: { fontFamily: "Georgia, serif", background: couleurs.noirProfond, color: couleurs.orClair, minHeight: "100vh", padding: "1rem" },
  bouton: { background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`, border: "none", borderRadius: "8px", padding: "0.5rem 0.9rem", color: couleurs.noirProfond, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px" },
  sec: { background: "rgba(227,178,60,0.12)", border: `1px solid rgba(227,178,60,0.45)`, borderRadius: "8px", padding: "0.5rem 0.9rem", color: couleurs.orClair, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px", textDecoration: "none" },
  carte: { background: "rgba(245,233,200,0.05)", border: `1px solid ${couleurs.bronze}`, borderRadius: "10px", padding: "1rem", marginTop: "0.75rem" },
  champ: { background: "rgba(0,0,0,0.45)", border: `1px solid rgba(227,178,60,0.35)`, borderRadius: "6px", padding: "0.35rem 0.5rem", color: couleurs.orClair, fontFamily: "sans-serif", fontSize: "13px", width: "80px", boxSizing: "border-box" }
};

function Carte() {
  const canvasRef = useRef(null);
  const conteneurRef = useRef(null);
  const glisse = useRef({ actif: false, x: 0, y: 0, bouge: false });

  const [monde, setMonde] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [vue, setVue] = useState({ x: 0, y: 0 });     // coin haut-gauche affiche, en unites monde
  const [selection, setSelection] = useState(null);
  const [detail, setDetail] = useState(null);
  const [armee, setArmee] = useState({});
  const [nomsTroupes, setNomsTroupes] = useState({});
  const [choix, setChoix] = useState({});
  const [maVille, setMaVille] = useState(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());

  const [echec, setEchec] = useState("");

  const charger = useCallback(() => {
    return Promise.all([
      apiJoueur.get("/api/carte/monde"),
      apiJoueur.get("/api/troupes")
    ]).then(([resMonde, resTroupes]) => {
      setEchec("");
      setMonde(resMonde.data);
      setArmee(resTroupes.data.armee || {});
      const noms = {};
      (resTroupes.data.types || []).forEach((t) => { noms[t.code] = t.nom; });
      setNomsTroupes(noms);
      const mienne = resMonde.data.villes.find((v) => v.estMoi);
      if (mienne) setMaVille(mienne);
      setChargement(false);
      return resMonde.data;
    }).catch((err) => {
      setEchec(err.response?.data?.erreur || err.message || "Le serveur n'a pas repondu");
      setChargement(false);
      return null;
    });
  }, []);

  useEffect(() => {
    charger().then((d) => {
      if (!d) return;
      const mienne = d.villes.find((v) => v.estMoi);
      if (mienne) setVue({ x: Math.max(0, mienne.x - 260), y: Math.max(0, mienne.y - 180) });
    });
    const r = setInterval(charger, 25000);
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => { clearInterval(r); clearInterval(t); };
  }, [charger]);

  // --- Rendu ---
  useEffect(() => {
    if (!monde || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const L = canvas.width, H = canvas.height;
    const taille = PAS * zoom;

    ctx.fillStyle = "#0A0806";
    ctx.fillRect(0, 0, L, H);

    function versEcran(x, y) {
      return [(x - vue.x) * zoom, (y - vue.y) * zoom];
    }

    // Terrain
    for (const t of monde.tiles) {
      const [ex, ey] = versEcran(t.x, t.y);
      if (ex < -taille || ey < -taille || ex > L || ey > H) continue;
      const conf = TERRAIN[t.typeTerrain] || TERRAIN.vide;
      ctx.fillStyle = conf.fond;
      ctx.fillRect(ex, ey, taille, taille);
      if (zoom > 0.7) {
        ctx.strokeStyle = conf.bord;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ex, ey, taille, taille);
      }
    }

    // Trajets de mes armees
    ctx.setLineDash([6, 5]);
    for (const m of monde.marches) {
      const [ox, oy] = versEcran(m.origine.x + PAS / 2, m.origine.y + PAS / 2);
      const [dx, dy] = versEcran(m.destination.x + PAS / 2, m.destination.y + PAS / 2);
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(dx, dy);
      ctx.strokeStyle = couleurs.or; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.setLineDash([]);

    // Camps ennemis
    for (const c of monde.camps) {
      const [ex, ey] = versEcran(c.x + PAS / 2, c.y + PAS / 2);
      if (ex < -30 || ey < -30 || ex > L + 30 || ey > H + 30) continue;
      const r = Math.max(4, 7 * zoom);
      ctx.beginPath();
      ctx.moveTo(ex, ey - r); ctx.lineTo(ex + r, ey + r * 0.8); ctx.lineTo(ex - r, ey + r * 0.8);
      ctx.closePath();
      ctx.fillStyle = c.niveau >= 5 ? "#8E1F1F" : "#C0392B";
      ctx.fill();
      ctx.strokeStyle = "#2C1008"; ctx.lineWidth = 1; ctx.stroke();
      if (zoom > 1) {
        ctx.fillStyle = "#fff"; ctx.font = `${Math.round(9 * zoom)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(c.niveau), ex, ey + r * 0.6);
      }
    }

    // Cites des joueurs
    for (const v of monde.villes) {
      const [ex, ey] = versEcran(v.x + PAS / 2, v.y + PAS / 2);
      if (ex < -40 || ey < -40 || ex > L + 40 || ey > H + 40) continue;
      const r = Math.max(5, 9 * zoom);
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fillStyle = v.estMoi ? "#5DCAA5" : "#E3B23C";
      ctx.fill();
      ctx.strokeStyle = v.protegee ? "#7FB3D5" : "#2C2C2A";
      ctx.lineWidth = v.protegee ? 3 : 1.5;
      ctx.stroke();
      if (zoom > 0.8) {
        ctx.fillStyle = "#0A0806";
        ctx.font = `bold ${Math.round(10 * zoom)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(v.joueur.slice(0, 10), ex, ey + r + 12 * zoom);
      }
    }

    // Palais des regions
    for (const reg of monde.regions) {
      const [ex, ey] = versEcran(reg.coordonnees.x, reg.coordonnees.y);
      if (ex < -60 || ey < -60 || ex > L + 60 || ey > H + 60) continue;
      const r = reg.estCapitale ? Math.max(7, 11 * zoom) : Math.max(5, 8 * zoom);
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fillStyle = reg.estCapitale ? "#F5C542" : "#B5735C";
      ctx.fill();
      ctx.strokeStyle = "#3A2A12"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#F5E9C8";
      ctx.font = `${reg.estCapitale ? "bold " : ""}${Math.round(11 * Math.max(0.9, zoom))}px Georgia, serif`;
      ctx.textAlign = "left";
      ctx.fillText(reg.nom, ex + r + 4, ey + 4);
    }

    // Case selectionnee
    if (selection) {
      const [ex, ey] = versEcran(selection.x, selection.y);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.strokeRect(ex, ey, taille, taille);
    }
  }, [monde, zoom, vue, selection]);

  // --- Interactions ---
  function coordonneesMonde(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const echelle = canvasRef.current.width / rect.width;
    const px = (e.clientX - rect.left) * echelle;
    const py = (e.clientY - rect.top) * echelle;
    return {
      x: Math.floor((px / zoom + vue.x) / PAS) * PAS,
      y: Math.floor((py / zoom + vue.y) / PAS) * PAS
    };
  }

  function debutGlisse(e) {
    glisse.current = { actif: true, x: e.clientX, y: e.clientY, bouge: false };
  }
  function pendantGlisse(e) {
    if (!glisse.current.actif) return;
    const dx = e.clientX - glisse.current.x;
    const dy = e.clientY - glisse.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) glisse.current.bouge = true;
    glisse.current.x = e.clientX; glisse.current.y = e.clientY;
    const rect = canvasRef.current.getBoundingClientRect();
    const echelle = canvasRef.current.width / rect.width;
    setVue((v) => ({
      x: Math.max(0, Math.min(monde.monde.largeur - 100, v.x - (dx * echelle) / zoom)),
      y: Math.max(0, Math.min(monde.monde.hauteur - 100, v.y - (dy * echelle) / zoom))
    }));
  }
  async function finGlisse(e) {
    const avaitBouge = glisse.current.bouge;
    glisse.current.actif = false;
    if (avaitBouge) return;

    const c = coordonneesMonde(e);
    setSelection(c);
    setErreur(""); setChoix({});
    try {
      const { data } = await apiJoueur.get(`/api/carte/case?x=${c.x}&y=${c.y}`);
      setDetail(data);
    } catch {
      setDetail(null);
    }
  }

  function molette(e) {
    e.preventDefault();
    const facteur = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * facteur)));
  }

  useEffect(() => {
    const el = conteneurRef.current;
    if (!el) return;
    el.addEventListener("wheel", molette, { passive: false });
    return () => el.removeEventListener("wheel", molette);
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={st.page}>Chargement du continent...</p>;

  if (echec || !monde) {
    return (
      <div style={st.page}>
        <Link to="/jeu" style={st.sec}>Retour a la cite</Link>
        <div style={{ ...st.carte, borderColor: "#E8837A", marginTop: "1rem" }}>
          <strong style={{ color: "#E8837A" }}>La carte n'a pas pu etre chargee</strong>
          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.5rem 0" }}>{echec}</p>
          <button style={st.bouton} onClick={() => { setChargement(true); charger(); }}>Reessayer</button>
        </div>
      </div>
    );
  }

  async function agir(fn) {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const res = await fn();
      if (res?.data?.message) setMessage(res.data.message);
      await charger();
      setDetail(null);
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Action impossible");
    } finally { setEnCours(false); }
  }

  const unitesDispo = Object.entries(armee).filter(([, q]) => q > 0);
  function troupesChoisies() {
    const t = {};
    for (const [type, v] of Object.entries(choix)) {
      const n = Number(v);
      if (Number.isInteger(n) && n > 0) t[type] = n;
    }
    return t;
  }

  function centrerSurMaVille() {
    if (maVille) setVue({ x: Math.max(0, maVille.x - 260), y: Math.max(0, maVille.y - 180) });
  }

  return (
    <div style={st.page}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link to="/jeu" style={st.sec}>Retour a la cite</Link>
        <h1 style={{ margin: "0 0 0 0.5rem", fontSize: "20px" }}>Continent de Jambar</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button style={st.sec} onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.3))}>−</button>
          <button style={st.sec} onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.3))}>+</button>
          <button style={st.sec} onClick={centrerSurMaVille}>Ma cite</button>
        </div>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.7, margin: "0.4rem 0" }}>
        Glisse pour te deplacer, molette pour zoomer, clique une case pour agir.
        Zoom {Math.round(zoom * 100)}%
      </p>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px" }}>{erreur}</p>}

      <div ref={conteneurRef} style={{ border: `2px solid ${couleurs.bronze}`, borderRadius: "10px", overflow: "hidden", background: "#0A0806" }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={720}
          onMouseDown={debutGlisse}
          onMouseMove={pendantGlisse}
          onMouseUp={finGlisse}
          onMouseLeave={() => { glisse.current.actif = false; }}
          style={{ width: "100%", display: "block", cursor: glisse.current.actif ? "grabbing" : "grab", touchAction: "none" }}
        />
      </div>

      {/* Legende */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.6rem", fontFamily: "sans-serif", fontSize: "12px" }}>
        {Object.entries(TERRAIN).map(([cle, t]) => (
          <span key={cle}><span style={{ background: t.fond, padding: "2px 9px", borderRadius: "3px", marginRight: "3px" }} />{t.nom}</span>
        ))}
        <span><span style={{ background: "#5DCAA5", padding: "2px 9px", borderRadius: "50%", marginRight: "3px" }} />Ta cite</span>
        <span><span style={{ background: "#E3B23C", padding: "2px 9px", borderRadius: "50%", marginRight: "3px" }} />Autres joueurs</span>
        <span><span style={{ background: "#C0392B", padding: "2px 9px", marginRight: "3px" }} />Camps ennemis</span>
      </div>

      {/* Armees en route */}
      {monde.marches.length > 0 && (
        <div style={st.carte}>
          <strong>Armees en deplacement ({monde.marches.length})</strong>
          {monde.marches.map((m) => {
            const arrivee = new Date(m.dateRetour).getTime();
            return (
              <p key={m._id} style={{ fontFamily: "sans-serif", fontSize: "12.5px", margin: "0.3rem 0", color: couleurs.vertClair }}>
                Vers ({m.destination.x}, {m.destination.y}) — retour dans {formaterDuree(Math.max(0, Math.round((arrivee - maintenant) / 1000)))}
              </p>
            );
          })}
        </div>
      )}

      {/* Detail de la case selectionnee */}
      {detail && (
        <div style={st.carte}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <strong>Case ({detail.tile.x}, {detail.tile.y})</strong>
            <button style={st.sec} onClick={() => setDetail(null)}>Fermer</button>
          </div>

          <p style={{ fontFamily: "sans-serif", fontSize: "13px", margin: "0.4rem 0" }}>
            {TERRAIN[detail.tile.typeTerrain]?.nom || detail.tile.typeTerrain}
            {detail.region && ` — ${detail.region.departement}, region de ${detail.region.nom}`}
            {detail.region?.estCapitale && " (capitale)"}
          </p>

          {/* Cite */}
          {detail.ville && (
            <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.or }}>
              Cite de {detail.ville.joueur} ({detail.ville.rang})
              {detail.ville.estMoi && " — c'est la tienne"}
            </p>
          )}

          {/* Camp ennemi : attaque */}
          {detail.camp && (
            <>
              <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#E8837A" }}>
                {detail.camp.nom} (niveau {detail.camp.niveau}) — {detail.camp.description}
              </p>
              {unitesDispo.length === 0 ? (
                <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.7 }}>
                  Aucune troupe en garnison.
                </p>
              ) : (
                <>
                  {unitesDispo.map(([type, dispo]) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", maxWidth: "330px", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "sans-serif", fontSize: "12.5px" }}>
                        {nomsTroupes[type] || type} <span style={{ opacity: 0.6 }}>({dispo})</span>
                      </span>
                      <input type="number" min="0" max={dispo} placeholder="0"
                        value={choix[type] || ""} onChange={(e) => setChoix({ ...choix, [type]: e.target.value })}
                        style={st.champ} />
                    </div>
                  ))}
                  <button style={st.bouton} disabled={enCours}
                    onClick={() => agir(() => apiJoueur.post("/api/combat/attaquer-camp", {
                      campCarteId: detail.camp._id, troupes: troupesChoisies()
                    }))}>
                    {enCours ? "Assaut..." : "Attaquer ce camp"}
                  </button>
                </>
              )}
            </>
          )}

          {/* Case de ressource : collecte */}
          {!detail.camp && !detail.ville && detail.tile.ressource && !detail.tile.proprietaire && (
            <>
              <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.or }}>
                Ressource recoltable : {detail.tile.ressource}
              </p>
              {unitesDispo.length === 0 ? (
                <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.7 }}>
                  Aucune troupe en garnison.
                </p>
              ) : (
                <>
                  {unitesDispo.map(([type, dispo]) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", maxWidth: "330px", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "sans-serif", fontSize: "12.5px" }}>
                        {nomsTroupes[type] || type} <span style={{ opacity: 0.6 }}>({dispo})</span>
                      </span>
                      <input type="number" min="0" max={dispo} placeholder="0"
                        value={choix[type] || ""} onChange={(e) => setChoix({ ...choix, [type]: e.target.value })}
                        style={st.champ} />
                    </div>
                  ))}
                  <button style={st.bouton} disabled={enCours}
                    onClick={() => agir(() => apiJoueur.post("/api/marche/collecter", {
                      tileId: detail.tile._id, troupes: troupesChoisies()
                    }))}>
                    {enCours ? "Envoi..." : "Envoyer recolter"}
                  </button>
                </>
              )}
            </>
          )}

          {!detail.camp && !detail.ville && !detail.tile.ressource && (
            <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.7 }}>
              Rien a faire sur cette case.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Carte;
