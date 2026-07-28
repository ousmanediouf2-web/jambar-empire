import { useEffect, useState } from "react";
import api from "../../services/api";

function AdminJoueurs() {
  const [joueurs, setJoueurs] = useState([]);
  const [joueurSelectionne, setJoueurSelectionne] = useState(null);
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    api.get("/api/admin/joueurs").then((res) => setJoueurs(res.data));
  }, []);

  async function voirHistorique(joueur) {
    setJoueurSelectionne(joueur);
    const { data } = await api.get(`/api/admin/joueurs/${joueur._id}/historique`);
    setHistorique(data);
  }

  async function basculerBan(joueur) {
    await api.put(`/api/admin/joueurs/${joueur._id}/bannir`, { banni: !joueur.banni });
    setJoueurs((prev) =>
      prev.map((j) => (j._id === joueur._id ? { ...j, banni: !j.banni } : j))
    );
  }

  return (
    <div>
      <h1>Joueurs</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #D3D1C7" }}>
            <th>Nom</th><th>Rang</th><th>Statut</th><th>Historique ressources</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {joueurs.map((joueur) => (
            <tr key={joueur._id} style={{ borderBottom: "1px solid #F1EFE8" }}>
              <td>{joueur.nom}</td>
              <td>{joueur.rang}</td>
              <td>{joueur.banni ? "Banni" : "Actif"}</td>
              <td><button onClick={() => voirHistorique(joueur)}>Voir</button></td>
              <td><button onClick={() => basculerBan(joueur)}>{joueur.banni ? "Debannir" : "Bannir"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {joueurSelectionne && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Historique de {joueurSelectionne.nom}</h2>
          <p style={{ fontSize: "13px", color: "#5F5E5A" }}>
            Origine de chaque mouvement de ressource : sert a detecter une anomalie (triche).
          </p>
          <ul>
            {historique.map((mvt) => (
              <li key={mvt._id}>
                {new Date(mvt.dateCreation).toLocaleString()} — {mvt.type} :{" "}
                {mvt.quantite > 0 ? "+" : ""}{mvt.quantite} (origine : {mvt.origine}) — solde apres : {mvt.soldeApres}
              </li>
            ))}
            {historique.length === 0 && <li>Aucun mouvement enregistre.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AdminJoueurs;
