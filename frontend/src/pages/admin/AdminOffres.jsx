import { useEffect, useState } from "react";
import api from "../../services/api";

function AdminOffres() {
  const [offres, setOffres] = useState([]);
  const [moyens, setMoyens] = useState([]);
  const [form, setForm] = useState({ nom: "", description: "", prix: 0, contenu: { or: 0, bois: 0, fer: 0, pierre: 0, ble: 0, accelerations: 0 } });

  function chargerDonnees() {
    api.get("/api/admin/offres").then((res) => setOffres(res.data));
    api.get("/api/admin/offres/moyens-paiement").then((res) => setMoyens(res.data));
  }

  useEffect(chargerDonnees, []);

  async function creerOffre(e) {
    e.preventDefault();
    await api.post("/api/admin/offres", form);
    setForm({ nom: "", description: "", prix: 0, contenu: { or: 0, bois: 0, fer: 0, pierre: 0, ble: 0, accelerations: 0 } });
    chargerDonnees();
  }

  async function basculerMoyenPaiement(moyen) {
    await api.put(`/api/admin/offres/moyens-paiement/${moyen._id}`, { actif: !moyen.actif });
    chargerDonnees();
  }

  async function supprimerOffre(id) {
    await api.delete(`/api/admin/offres/${id}`);
    chargerDonnees();
  }

  return (
    <div>
      <h1>Offres (packs) et moyens de paiement</h1>

      <h2 style={{ fontSize: "16px" }}>Creer un pack</h2>
      <form onSubmit={creerOffre} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px", marginBottom: "2rem" }}>
        <input placeholder="Nom du pack" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>Prix (FCFA) <input type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} required /></label>
        {Object.keys(form.contenu).map((cle) => (
          <label key={cle}>
            {cle}
            <input
              type="number"
              value={form.contenu[cle]}
              onChange={(e) => setForm({ ...form, contenu: { ...form.contenu, [cle]: Number(e.target.value) } })}
            />
          </label>
        ))}
        <button type="submit">Creer le pack</button>
      </form>

      <ul>
        {offres.map((offre) => (
          <li key={offre._id} style={{ marginBottom: "0.5rem" }}>
            <strong>{offre.nom}</strong> — {offre.prix} FCFA
            {" "}<button onClick={() => supprimerOffre(offre._id)}>Supprimer</button>
          </li>
        ))}
      </ul>

      <h2 style={{ fontSize: "16px", marginTop: "2rem" }}>Moyens de paiement</h2>
      <ul>
        {moyens.map((moyen) => (
          <li key={moyen._id}>
            {moyen.nom} ({moyen.fournisseur}) — {moyen.actif ? "actif" : "desactive"}
            {" "}<button onClick={() => basculerMoyenPaiement(moyen)}>
              {moyen.actif ? "Desactiver" : "Activer"}
            </button>
          </li>
        ))}
        {moyens.length === 0 && <li>Aucun moyen de paiement configure pour le moment.</li>}
      </ul>
    </div>
  );
}

export default AdminOffres;
