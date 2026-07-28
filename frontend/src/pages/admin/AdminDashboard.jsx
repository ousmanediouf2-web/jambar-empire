import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import { couleurs } from "../../theme";
import logo from "../../assets/logo-carre.png";

const MENU = [
  { chemin: "/admin/joueurs", nom: "Joueurs", desc: "Ressources, armees, bannissements" },
  { chemin: "/admin/dons", nom: "Dons et annonces", desc: "Offrir des lots, ecrire a tous" },
  { chemin: "/admin/evenements", nom: "Evenements", desc: "Programmer les bonus du royaume" },
  { chemin: "/admin/offres", nom: "Boutique", desc: "Packs et moyens de paiement" }
];

function estConnecte() {
  return Boolean(localStorage.getItem("token_admin"));
}

function AdminDashboard() {
  const emplacement = useLocation();
  if (!estConnecte()) return <Navigate to="/admin/connexion" replace />;

  function seDeconnecter() {
    localStorage.removeItem("token_admin");
    window.location.href = "/admin/connexion";
  }

  const st = {
    page: {
      display: "flex", minHeight: "100vh",
      fontFamily: "Georgia, serif",
      background: couleurs.noirProfond, color: couleurs.orClair,
      flexWrap: "wrap"
    },
    barre: {
      width: "240px", minWidth: "200px", flexShrink: 0,
      background: `linear-gradient(180deg, #1A1712, ${couleurs.noirProfond})`,
      borderRight: `2px solid ${couleurs.bronze}`,
      padding: "1.25rem 1rem", boxSizing: "border-box"
    },
    lien: (actif) => ({
      display: "block", textDecoration: "none", borderRadius: "8px",
      padding: "0.6rem 0.75rem", marginBottom: "0.5rem",
      background: actif ? "rgba(227,178,60,0.18)" : "transparent",
      border: actif ? `1px solid ${couleurs.or}` : "1px solid transparent",
      color: couleurs.orClair
    }),
    contenu: { flex: 1, minWidth: "300px", padding: "1.5rem" }
  };

  return (
    <div style={st.page}>
      <nav style={st.barre}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <img src={logo} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px" }}>Jambar Empire</div>
            <div style={{ fontSize: "11px", opacity: 0.75, fontFamily: "sans-serif" }}>Administration</div>
          </div>
        </div>

        <div style={{ height: "1px", background: `linear-gradient(to right, transparent, ${couleurs.bronze}, transparent)`, margin: "0 0 1rem" }} />

        {MENU.map((m) => {
          const actif = emplacement.pathname === m.chemin ||
            (m.chemin === "/admin/joueurs" && emplacement.pathname === "/admin");
          return (
            <Link key={m.chemin} to={m.chemin} style={st.lien(actif)}>
              <div style={{ fontSize: "14px", color: actif ? couleurs.or : couleurs.orClair }}>{m.nom}</div>
              <div style={{ fontSize: "11px", opacity: 0.6, fontFamily: "sans-serif" }}>{m.desc}</div>
            </Link>
          );
        })}

        <div style={{ height: "1px", background: "rgba(227,178,60,0.2)", margin: "1rem 0" }} />

        <Link to="/jeu" style={{ ...st.lien(false), fontSize: "13px", opacity: 0.85 }}>Retour au jeu</Link>
        <button onClick={seDeconnecter}
          style={{
            width: "100%", marginTop: "0.5rem",
            background: "rgba(227,178,60,0.12)", border: `1px solid rgba(227,178,60,0.4)`,
            borderRadius: "8px", padding: "0.5rem", color: couleurs.orClair,
            cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "13px"
          }}>
          Se deconnecter
        </button>
      </nav>

      <main style={st.contenu}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminDashboard;
