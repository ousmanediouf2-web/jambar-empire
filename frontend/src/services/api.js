import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token_admin");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Deconnexion automatique si le token expire ou est invalide
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      localStorage.removeItem("token_admin");
      window.location.href = "/admin/connexion";
    }
    return Promise.reject(erreur);
  }
);

export default api;
