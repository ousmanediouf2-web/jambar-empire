import { useEffect, useState } from "react";
import api from "../../services/api";

const TYPES = ["bonus_production", "double_xp", "tournoi", "bataille_speciale"];

function AdminEvenements() {
  const [evenements, setEvenements] = useState([]);
  const [form, setForm] = useState({ titre: "", description: "", type: TYPES[0], dateDebut: "", dateFin: "" });

  function chargerEvenements() {
    api.get("/api/admin/evenements").then((res) => setEvenements(res.data));
  }

  useEffect(chargerEvenements, []);

  async function creerEvenement(e) {
    e.preventDefault();
    await api.post("/api/admin/evenements", form);
    setForm({ titre: "", description: "", type: TYPES[0], dateDebut: "", dateFin: "" });
    chargerEvenements();
  }

  async function supprimerEvenement(id) {
    await api.delete(`/api/admin/evenements/${id}`);
    chargerEvenements();
  }

  return (
    <div>
      <h1>Evenements</h1>

      <form onSubmit={creerEvenement} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px", marginBottom: "2rem" }}>
        <input placeholder="Titre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label>Date de debut <input type="datetime-local" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required /></label>
        <label>Date de fin <input type="datetime-local" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} required /></label>
        <button type="submit">Creer l'evenement</button>
      </form>

      <ul>
        {evenements.map((ev) => (
          <li key={ev._id} style={{ marginBottom: "0.5rem" }}>
            <strong>{ev.titre}</strong> ({ev.type}) — du {new Date(ev.dateDebut).toLocaleString()} au {new Date(ev.dateFin).toLocaleString()}
            {" "}<button onClick={() => supprimerEvenement(ev._id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminEvenements;
