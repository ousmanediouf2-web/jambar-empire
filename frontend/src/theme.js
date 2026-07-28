// Identite visuelle Jambar Empire, tiree du logo officiel :
// or metallique, noir profond, vert royal, bronze.
export const couleurs = {
  noir: "#100D08",
  noirProfond: "#0A0806",
  panneau: "#1A1712",
  or: "#E3B23C",
  orClair: "#F5E9C8",
  bronze: "#BA7517",
  vertRoyal: "#0F6E56",
  vertClair: "#5DCAA5",
  rouge: "#C0392B"
};

export const styles = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: `radial-gradient(circle at 50% 0%, #1A1712 0%, ${couleurs.noirProfond} 70%)`,
    color: couleurs.orClair,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    boxSizing: "border-box"
  },
  titre: {
    fontSize: "clamp(26px, 6vw, 44px)",
    letterSpacing: "2px",
    margin: "0.5rem 0",
    background: `linear-gradient(180deg, ${couleurs.orClair} 20%, ${couleurs.or} 60%, ${couleurs.bronze} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textAlign: "center"
  },
  sousTitre: {
    fontSize: "14px",
    opacity: 0.75,
    textAlign: "center",
    maxWidth: "460px",
    lineHeight: 1.6,
    fontFamily: "sans-serif"
  },
  panneau: {
    background: `linear-gradient(160deg, ${couleurs.panneau}, ${couleurs.noirProfond})`,
    border: `1px solid ${couleurs.bronze}`,
    borderRadius: "14px",
    padding: "1.75rem",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    boxSizing: "border-box"
  },
  champ: {
    width: "100%",
    background: "rgba(0,0,0,0.45)",
    border: `1px solid rgba(227,178,60,0.35)`,
    borderRadius: "8px",
    padding: "0.7rem 0.9rem",
    color: couleurs.orClair,
    fontSize: "14px",
    fontFamily: "sans-serif",
    boxSizing: "border-box",
    outline: "none"
  },
  boutonPrincipal: {
    width: "100%",
    background: `linear-gradient(180deg, ${couleurs.or}, ${couleurs.bronze})`,
    border: "none",
    borderRadius: "8px",
    padding: "0.8rem",
    color: couleurs.noirProfond,
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    boxSizing: "border-box"
  },
  boutonSecondaire: {
    background: "rgba(227,178,60,0.1)",
    border: `1px solid rgba(227,178,60,0.4)`,
    borderRadius: "8px",
    padding: "0.7rem 1.2rem",
    color: couleurs.orClair,
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    fontFamily: "Georgia, serif"
  },
  lien: {
    color: couleurs.or,
    textDecoration: "none",
    fontFamily: "sans-serif",
    fontSize: "13px"
  },
  erreur: {
    color: "#E8837A",
    fontSize: "13px",
    fontFamily: "sans-serif",
    margin: "0.5rem 0 0"
  },
  separateur: {
    height: "1px",
    background: `linear-gradient(to right, transparent, ${couleurs.bronze}, transparent)`,
    margin: "1.25rem 0"
  }
};
