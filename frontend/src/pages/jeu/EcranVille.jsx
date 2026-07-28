import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import apiJoueur from "../../services/apiJoueur";
import { couleurs } from "../../theme";
import { formaterDuree } from "../../data/batiments";
import { spriteBatiment, SPRITE_CHANTIER } from "../../data/sprites";
import { PARCELLES_INTERIEUR, PARCELLES_EXTERIEUR } from "../../data/parcelles";
import logo from "../../assets/logo-carre.png";

const RESSOURCES = [
  { cle: "ble", label: "Nourriture", symbole: "🌾" },
  { cle: "bois", label: "Bois", symbole: "🪵" },
  { cle: "pierre", label: "Pierre", symbole: "🪨" },
  { cle: "fer", label: "Fer", symbole: "⛓" },
  { cle: "argent", label: "Argent", symbole: "🪙" },
  { cle: "or", label: "Or", symbole: "💎" }
];

const NAV_GAUCHE = [
  { nom: "Recherche", lien: "/jeu/recherche" },
  { nom: "Entrainer", lien: "/jeu/entrainement" },
  { nom: "Heros", lien: "/jeu/heros" },
  { nom: "Quetes", lien: "/jeu/quetes" }
];

const NAV_DROITE = [
  { nom: "Carte", lien: "/jeu/carte" },
  { nom: "Campagne", lien: "/jeu/combat" },
  { nom: "Alliance", lien: "/jeu/alliance" },
  { nom: "Sac", lien: "/jeu/objets" }
];

const NAV_BAS = [
  { nom: "Equipement", lien: "/jeu/inventaire" },
  { nom: "Marche", lien: "/jeu/marche" },
  { nom: "Messages", lien: "/jeu/messages" },
  { nom: "Classement", lien: "/jeu/classement" },
  { nom: "Evenements", lien: "/jeu/evenements" },
  { nom: "Boutique", lien: "/jeu/boutique" }
];

function estConnecte() {
  return Boolean(localStorage.getItem("token_joueur"));
}

// Geometrie d'une parcelle calibree : cadre exact + trace du polygone.
// Le batiment sera pose sur ce cadre, sa base alignee sur le bas de la parcelle.
function geometrieParcelle(p) {
  if (Array.isArray(p.points) && p.points.length === 4) {
    const xs = p.points.map((pt) => pt[0]);
    const ys = p.points.map((pt) => pt[1]);
    const gauche = Math.min(...xs);
    const droite = Math.max(...xs);
    const haut = Math.min(...ys);
    const bas = Math.max(...ys);
    return {
      gauche, haut, bas,
      largeur: droite - gauche,
      hauteur: bas - haut,
      cx: (gauche + droite) / 2,
      cy: (haut + bas) / 2,
      trace: p.points.map(([x, y]) => `${x}% ${y}%`).join(", ")
    };
  }
  return {
    gauche: p.x - 8, haut: p.y - 6, bas: p.y + 6,
    largeur: 16, hauteur: 12, cx: p.x, cy: p.y, trace: null
  };
}

function formaterNombre(n) {
  if (n === undefined || n === null) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

const st = {
  page: { fontFamily: "Georgia, serif", background: couleurs.noirProfond, color: couleurs.orClair, minHeight: "100vh" },
  barre: {
    display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.6rem",
    padding: "0.6rem 1rem", background: "linear-gradient(to bottom, #1A1712, rgba(26,23,18,0.9))",
    borderBottom: `2px solid ${couleurs.bronze}`
  },
  pastille: {
    background: "rgba(0,0,0,0.45)", border: "1px solid rgba(227,178,60,0.25)",
    borderRadius: "8px", padding: "0.25rem 0.6rem", fontSize: "12.5px",
    display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap"
  },
  rond: {
    width: "62px", height: "62px", borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #2A2419, #12100B)",
    border: `2px solid ${couleurs.bronze}`, color: couleurs.or,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11.5px", textAlign: "center", textDecoration: "none",
    cursor: "pointer", fontFamily: "Georgia, serif", padding: "4px", boxSizing: "border-box"
  },
  bouton: {
    background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`, border: "none",
    borderRadius: "8px", padding: "0.5rem 0.95rem", color: couleurs.noirProfond,
    fontWeight: 700, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px"
  },
  boutonSec: {
    background: "rgba(227,178,60,0.12)", border: "1px solid rgba(227,178,60,0.45)",
    borderRadius: "8px", padding: "0.5rem 0.95rem", color: couleurs.orClair,
    cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px", textDecoration: "none"
  }
};

function EcranVille() {
  const [joueur, setJoueur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [zone, setZone] = useState("interieur");
  const [parcelleChoisie, setParcelleChoisie] = useState(null);
  const [batimentOuvert, setBatimentOuvert] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [maintenant, setMaintenant] = useState(Date.now());

  function charger() {
    return apiJoueur.get("/api/joueur/moi").then((res) => {
      setJoueur(res.data);
      setChargement(false);
    });
  }

  useEffect(() => {
    charger();
    const r = setInterval(charger, 20000);
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => { clearInterval(r); clearInterval(t); };
  }, []);

  if (!estConnecte()) return <Navigate to="/connexion" replace />;
  if (chargement) return <p style={{ ...st.page, padding: "2rem" }}>Chargement de la cite...</p>;

  const ville = joueur?.villes?.[0];
  const cite = joueur?.cite;
  const troupes = Object.entries(ville?.armee || {})
    .filter(([c]) => c !== "_id").reduce((t, [, q]) => t + (q || 0), 0);

  async function action(fn) {
    setMessage(""); setErreur(""); setEnCours(true);
    try {
      const res = await fn();
      if (res?.data?.message) setMessage(res.data.message);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Une erreur est survenue");
    } finally { setEnCours(false); }
  }

  function seDeconnecter() {
    localStorage.removeItem("token_joueur");
    window.location.href = "/connexion";
  }

  const emplacements = cite?.[zone] || [];
  const parcelles = zone === "interieur" ? PARCELLES_INTERIEUR : PARCELLES_EXTERIEUR;
  const constructibles = zone === "interieur"
    ? cite?.constructiblesInterieur || []
    : cite?.constructiblesExterieur || [];
  const fond = zone === "interieur" ? "/images/cite-interieur.jpg" : "/images/cite-exterieur.jpg";

  return (
    <div style={st.page}>
      {/* Barre du haut */}
      <div style={st.barre}>
        <img src={logo} alt="" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ marginRight: "0.4rem" }}>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>{joueur?.nom}</div>
          <div style={{ fontSize: "11px", opacity: 0.8 }}>{joueur?.rang} — {formaterNombre(troupes)} troupes</div>
        </div>
        {RESSOURCES.map(({ cle, symbole, label }) => (
          <div key={cle} style={st.pastille} title={label}>
            <span>{symbole}</span><span>{formaterNombre(ville?.ressources?.[cle])}</span>
          </div>
        ))}
        <button onClick={seDeconnecter} style={{ ...st.boutonSec, marginLeft: "auto" }}>Deconnexion</button>
      </div>

      {message && <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px", padding: "0.5rem 1rem 0", margin: 0 }}>{message}</p>}
      {erreur && <p style={{ color: "#E8837A", fontFamily: "sans-serif", fontSize: "13px", padding: "0.5rem 1rem 0", margin: 0 }}>{erreur}</p>}

      {cite?.niveauPalais === 0 && (
        <div style={{ margin: "0.75rem 1rem 0", padding: "0.85rem 1rem", background: "rgba(227,178,60,0.12)", border: `1px solid ${couleurs.or}`, borderRadius: "10px" }}>
          <strong style={{ color: couleurs.or }}>Premiers pas</strong>
          <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", margin: "0.35rem 0 0", lineHeight: 1.6 }}>
            Ton Palais Royal est au niveau 0. Ameliore-le d'abord : il autorise la construction
            de tout le reste. Puis batis fermes, scieries, carrieres et mines a l'exterieur.
          </p>
        </div>
      )}

      {/* Choix de zone */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "0.85rem 1rem 0.5rem", flexWrap: "wrap" }}>
        <button style={zone === "interieur" ? st.bouton : st.boutonSec} onClick={() => { setZone("interieur"); setParcelleChoisie(null); }}>
          Interieur ({cite?.interieur?.filter((e) => !e.vide).length || 0}/{cite?.interieur?.length || 0})
        </button>
        <button style={zone === "exterieur" ? st.bouton : st.boutonSec} onClick={() => { setZone("exterieur"); setParcelleChoisie(null); }}>
          Exterieur — champs ({cite?.exterieur?.filter((e) => !e.vide).length || 0}/{cite?.exterieur?.length || 0})
        </button>
      </div>

      {/* Vue de la cite */}
      <div style={{ position: "relative", width: "100%", maxWidth: "1100px", margin: "0 auto", aspectRatio: "1 / 1", backgroundImage: `url(${fond})`, backgroundSize: "cover", backgroundPosition: "center", border: `2px solid ${couleurs.bronze}`, borderRadius: "10px", overflow: "hidden" }}>

        {parcelles.map((p) => {
          const e = emplacements.find((x) => x.index === p.index);
          if (!e) return null;

          const g = geometrieParcelle(p);
          const restant = e.finAmelioration
            ? Math.max(0, Math.round((new Date(e.finAmelioration).getTime() - maintenant) / 1000))
            : null;

          if (e.vide) {
            return (
              <div key={p.index}>
                {g.trace && (
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "rgba(227,178,60,0.20)",
                    clipPath: `polygon(${g.trace})`
                  }} />
                )}
                <button
                  title="Emplacement libre"
                  onClick={() => { setParcelleChoisie(p.index); setErreur(""); }}
                  style={{
                    position: "absolute", left: `${g.gauche}%`, top: `${g.haut}%`,
                    width: `${g.largeur}%`, height: `${g.hauteur}%`,
                    background: "transparent", border: "none", padding: 0,
                    cursor: "pointer", color: couleurs.or,
                    fontSize: "clamp(14px, 2vw, 24px)", lineHeight: 1,
                    textShadow: "0 0 6px rgba(0,0,0,0.95)"
                  }}>
                  +
                </button>
              </div>
            );
          }

          const enTravaux = restant !== null && restant > 0;
          const img = enTravaux ? SPRITE_CHANTIER : spriteBatiment(e.type);

          return (
            <button key={p.index}
              title={`${e.nom} — niveau ${e.niveau}`}
              onClick={() => { setBatimentOuvert(e); setErreur(""); }}
              style={{
                position: "absolute",
                left: `${g.gauche}%`,
                top: `${g.bas}%`,
                width: `${g.largeur}%`,
                transform: "translateY(-100%)",
                background: "transparent", border: "none", padding: 0,
                cursor: "pointer", display: "block", lineHeight: 0
              }}>
              {img && (
                <img src={img} alt="" style={{
                  width: "100%", display: "block",
                  filter: "drop-shadow(0 3px 7px rgba(0,0,0,0.75))"
                }} />
              )}
              <span style={{
                position: "absolute", left: "50%", bottom: "-2px",
                transform: "translateX(-50%)",
                background: "rgba(10,8,6,0.9)",
                border: `1px solid ${enTravaux ? couleurs.vertClair : "rgba(227,178,60,0.55)"}`,
                borderRadius: "5px", padding: "1px 6px",
                fontSize: "clamp(8px, 1vw, 11.5px)", lineHeight: 1.5,
                color: couleurs.orClair, whiteSpace: "nowrap", fontFamily: "Georgia, serif"
              }}>
                {e.nom} {enTravaux ? `· ${formaterDuree(restant)}` : `N${e.niveau}`}
              </span>
            </button>
          );
        })}

        {/* Boutons ronds sur les cotes */}
        <div style={{ position: "absolute", left: "8px", top: "10%", display: "flex", flexDirection: "column", gap: "8px" }}>
          {NAV_GAUCHE.map((n) => <Link key={n.nom} to={n.lien} style={st.rond}>{n.nom}</Link>)}
        </div>
        <div style={{ position: "absolute", right: "8px", top: "10%", display: "flex", flexDirection: "column", gap: "8px" }}>
          {NAV_DROITE.map((n) => <Link key={n.nom} to={n.lien} style={st.rond}>{n.nom}</Link>)}
        </div>
        <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {NAV_BAS.map((n) => <Link key={n.nom} to={n.lien} style={st.rond}>{n.nom}</Link>)}
        </div>
      </div>

      {/* Fenetre de construction */}
      {parcelleChoisie !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50 }}
          onClick={() => setParcelleChoisie(null)}>
          <div onClick={(ev) => ev.stopPropagation()}
            style={{ background: "#1A1712", borderRadius: "12px", padding: "1.4rem", maxWidth: "540px", width: "100%", border: `1px solid ${couleurs.bronze}`, maxHeight: "85vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Construire — parcelle {parcelleChoisie + 1}</h3>
            {Object.entries(
              constructibles.reduce((acc, b) => {
                (acc[b.categorieNom || "Autres"] ||= []).push(b);
                return acc;
              }, {})
            ).map(([categorie, liste]) => (
              <div key={categorie} style={{ marginBottom: "0.75rem" }}>
                <h4 style={{ fontSize: "13px", color: couleurs.or, margin: "0.75rem 0 0.25rem" }}>{categorie}</h4>
                {liste.map((b) => {
              const bloque = b.dejaConstruit || !b.palaisOk || !b.prerequisOk;
              return (
                <div key={b.code} style={{ borderBottom: "1px solid rgba(227,178,60,0.15)", padding: "0.65rem 0", opacity: bloque ? 0.5 : 1, display: "flex", gap: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
                  {spriteBatiment(b.code) && (
                    <img src={spriteBatiment(b.code)} alt="" style={{ width: "76px", height: "58px", objectFit: "contain" }} />
                  )}
                  <div style={{ flex: 1, minWidth: "170px" }}>
                    <strong style={{ fontSize: "14px" }}>{b.nom}</strong>
                    <div style={{ fontFamily: "sans-serif", fontSize: "11.5px", opacity: 0.72, marginTop: "0.2rem" }}>{b.role}</div>
                    <div style={{ fontFamily: "sans-serif", fontSize: "11px", opacity: 0.65, marginTop: "0.25rem" }}>
                      {Object.entries(b.cout).map(([r, q]) => `${q} ${r}`).join(", ")} — {formaterDuree(b.dureeSecondes)}
                    </div>
                    {b.dejaConstruit && <div style={{ fontFamily: "sans-serif", fontSize: "11px", color: couleurs.bronze }}>Deja construit</div>}
                    {!b.palaisOk && <div style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#E8837A" }}>Palais niveau {b.palaisRequis} requis</div>}
                    {b.palaisOk && !b.prerequisOk && <div style={{ fontFamily: "sans-serif", fontSize: "11px", color: "#E8837A" }}>{b.messagePrerequis}</div>}
                    {b.niveauMax && <div style={{ fontFamily: "sans-serif", fontSize: "10.5px", opacity: 0.5 }}>Niveau maximum : {b.niveauMax}</div>}
                  </div>
                  <button style={st.bouton} disabled={enCours || bloque}
                    onClick={() => action(() => apiJoueur.post(`/api/joueur/ville/${ville._id}/construire`, { type: b.code, zone, emplacement: parcelleChoisie })).then(() => setParcelleChoisie(null))}>
                    Construire
                  </button>
                </div>
              );
                })}
              </div>
            ))}
            <button style={{ ...st.boutonSec, marginTop: "1rem" }} onClick={() => setParcelleChoisie(null)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Fenetre de gestion d'un batiment */}
      {batimentOuvert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50 }}
          onClick={() => setBatimentOuvert(null)}>
          <div onClick={(ev) => ev.stopPropagation()}
            style={{ background: "#1A1712", borderRadius: "12px", padding: "1.4rem", maxWidth: "380px", width: "100%", border: `1px solid ${couleurs.bronze}` }}>
            {spriteBatiment(batimentOuvert.type) && (
              <img src={spriteBatiment(batimentOuvert.type)} alt=""
                style={{ width: "100%", maxHeight: "140px", objectFit: "contain", marginBottom: "0.5rem", display: "block" }} />
            )}
            <h3 style={{ marginTop: 0 }}>{batimentOuvert.nom}</h3>
            <p style={{ fontFamily: "sans-serif", fontSize: "12.5px", opacity: 0.78 }}>{batimentOuvert.role}</p>
            <p style={{ fontFamily: "sans-serif", fontSize: "13px" }}>
              Niveau actuel : {batimentOuvert.niveau}
              {batimentOuvert.niveauMax ? ` / ${batimentOuvert.niveauMax}` : ""}
            </p>

            {batimentOuvert.finAmelioration ? (
              <p style={{ color: couleurs.vertClair, fontFamily: "sans-serif", fontSize: "13px" }}>
                Travaux — pret dans {formaterDuree(Math.max(0, Math.round((new Date(batimentOuvert.finAmelioration).getTime() - maintenant) / 1000)))}
              </p>
            ) : (
              <>
                <p style={{ fontFamily: "sans-serif", fontSize: "12px", opacity: 0.75 }}>
                  Niveau {batimentOuvert.niveau + 1} : {Object.entries(batimentOuvert.coutProchainNiveau || {}).map(([r, q]) => `${q} ${r}`).join(", ")} — {formaterDuree(batimentOuvert.dureeProchainNiveau)}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <button style={st.bouton} disabled={enCours}
                    onClick={() => action(() => apiJoueur.post(`/api/joueur/ville/${ville._id}/batiments/${batimentOuvert.type}/ameliorer`)).then(() => setBatimentOuvert(null))}>
                    Ameliorer
                  </button>
                  {!batimentOuvert.fixe && (
                    <button style={st.boutonSec} disabled={enCours}
                      onClick={() => {
                        if (window.confirm(`Demolir ${batimentOuvert.nom} ? Tu recuperes la moitie des ressources.`)) {
                          action(() => apiJoueur.delete(`/api/joueur/ville/${ville._id}/batiments/${batimentOuvert.type}`)).then(() => setBatimentOuvert(null));
                        }
                      }}>
                      Demolir
                    </button>
                  )}
                  <button style={st.boutonSec} onClick={() => setBatimentOuvert(null)}>Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EcranVille;
