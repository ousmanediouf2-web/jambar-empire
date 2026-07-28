import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AdminConnexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  async function seConnecter(e) {
    e.preventDefault();
    setErreur("");
    try {
      const { data } = await api.post("/api/auth/connexion", { email, motDePasse });
      if (data.joueur.role !== "admin") {
        setErreur("Ce compte n'a pas les droits administrateur");
        return;
      }
      localStorage.setItem("token_admin", data.token);
      navigate("/admin");
    } catch (err) {
      setErreur(err.response?.data?.erreur || "Erreur de connexion");
    }
  }

  return (
    <div style={{ maxWidth: "360px", margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Connexion administrateur</h1>
      <form onSubmit={seConnecter} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
        {erreur && <p style={{ color: "#A32D2D" }}>{erreur}</p>}
      </form>
    </div>
  );
}

export default AdminConnexion;
