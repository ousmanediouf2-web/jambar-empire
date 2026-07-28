import { useState } from "react";
import { couleurs } from "../theme";

// Outil interne : delimite chaque parcelle par 4 points cliques sur l'image.
// Genere le code a coller dans src/data/parcelles.js

const IMAGES = [
  { cle: "interieur", nom: "Interieur de la cite", src: "/images/cite-interieur.jpg" },
  { cle: "exterieur", nom: "Exterieur (champs)", src: "/images/cite-exterieur.jpg" }
];

function Calibrage() {
  const [image, setImage] = useState(IMAGES[0]);
  const [parcelles, setParcelles] = useState([]);   // parcelles terminees
  const [enCours, setEnCours] = useState([]);       // points de la parcelle courante

  function auClic(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    const points = [...enCours, [x, y]];
    if (points.length === 4) {
      setParcelles((p) => [...p, points]);
      setEnCours([]);
    } else {
      setEnCours(points);
    }
  }

  function annulerDernierPoint() {
    if (enCours.length > 0) setEnCours((p) => p.slice(0, -1));
    else setParcelles((p) => p.slice(0, -1));
  }

  const code =
    "export const PARCELLES_" + image.cle.toUpperCase() + " = [\n" +
    parcelles.map((pts, i) =>
      `  { index: ${i}, points: [${pts.map(([x, y]) => `[${x},${y}]`).join(", ")}] }`
    ).join(",\n") +
    "\n];";

  const st = {
    bouton: {
      background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`,
      border: "none", borderRadius: "8px", padding: "0.5rem 1rem",
      color: couleurs.noirProfond, fontWeight: 700, cursor: "pointer",
      fontFamily: "Georgia, serif", fontSize: "13px"
    },
    sec: {
      background: "rgba(227,178,60,0.12)", border: "1px solid rgba(227,178,60,0.45)",
      borderRadius: "8px", padding: "0.5rem 1rem", color: couleurs.orClair,
      cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px"
    }
  };

  function polygone(pts) {
    return pts.map(([x, y]) => `${x}% ${y}%`).join(", ");
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: couleurs.noir, color: couleurs.orClair, minHeight: "100vh", padding: "1.5rem 1rem" }}>
      <h1 style={{ fontSize: "20px", marginTop: 0 }}>Calibrage des parcelles</h1>
      <p style={{ fontFamily: "sans-serif", fontSize: "13px", opacity: 0.85, maxWidth: "720px", lineHeight: 1.6 }}>
        Clique les <strong>4 coins</strong> de chaque parcelle, dans le sens horaire en partant du coin haut.
        Au 4e clic la parcelle est validee et tu passes automatiquement a la suivante.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0" }}>
        {IMAGES.map((im) => (
          <button key={im.cle} style={image.cle === im.cle ? st.bouton : st.sec}
            onClick={() => { setImage(im); setParcelles([]); setEnCours([]); }}>
            {im.nom}
          </button>
        ))}
        <button style={st.sec} onClick={annulerDernierPoint}>Annuler le dernier point</button>
        <button style={st.sec} onClick={() => { setParcelles([]); setEnCours([]); }}>Tout effacer</button>
        <button style={st.sec} onClick={() => navigator.clipboard?.writeText(code)}>Copier le code</button>
      </div>

      <p style={{ fontFamily: "sans-serif", fontSize: "13px", color: couleurs.or }}>
        {parcelles.length} parcelle(s) terminee(s) — parcelle en cours : {enCours.length}/4 points
      </p>

      <div onClick={auClic}
        style={{
          position: "relative", width: "100%", maxWidth: "900px", aspectRatio: "1 / 1",
          backgroundImage: `url(${image.src})`, backgroundSize: "cover", backgroundPosition: "center",
          border: `2px solid ${couleurs.bronze}`, borderRadius: "10px",
          cursor: "crosshair", userSelect: "none"
        }}>

        {/* Parcelles terminees */}
        {parcelles.map((pts, i) => {
          const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
          const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(93,202,165,0.32)",
                border: `2px solid ${couleurs.vertClair}`,
                clipPath: `polygon(${polygone(pts)})`
              }} />
              <div style={{
                position: "absolute", left: `${cx}%`, top: `${cy}%`,
                transform: "translate(-50%,-50%)", color: "#fff",
                fontSize: "14px", fontWeight: 700, textShadow: "0 0 4px #000"
              }}>{i}</div>
            </div>
          );
        })}

        {/* Points de la parcelle en cours */}
        {enCours.map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute", left: `${x}%`, top: `${y}%`,
            transform: "translate(-50%,-50%)", width: "16px", height: "16px",
            borderRadius: "50%", background: couleurs.or, border: "2px solid #fff",
            pointerEvents: "none"
          }} />
        ))}
      </div>

      <pre style={{
        background: "#12100B", border: `1px solid ${couleurs.bronze}`, borderRadius: "8px",
        padding: "1rem", fontSize: "12px", overflowX: "auto", fontFamily: "monospace",
        color: couleurs.orClair, maxWidth: "900px", marginTop: "1rem"
      }}>{code}</pre>
    </div>
  );
}

export default Calibrage;
