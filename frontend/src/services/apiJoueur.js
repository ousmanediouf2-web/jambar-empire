import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiJoueur = axios.create({ baseURL: API_URL });

apiJoueur.interceptors.request.use((config) => {
  const token = localStorage.getItem("token_joueur");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiJoueur.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      localStorage.removeItem("token_joueur");
      window.location.href = "/connexion";
    }
    return Promise.reject(erreur);
  }
);

export default apiJoueur;
