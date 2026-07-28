import { couleurs } from "./theme";

// Styles communs aux ecrans de jeu, pour eviter de les redefinir partout.
export const styleJeu = {
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
  grille: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
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
  },
  ligne: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(227,178,60,0.12)",
    fontFamily: "sans-serif",
    fontSize: "13px",
    flexWrap: "wrap"
  }
};
