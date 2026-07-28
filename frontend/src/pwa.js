export function enregistrerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((err) => console.error("Echec enregistrement service worker :", err));
    });
  }
}

let evenementInstallDiffere = null;

export function ecouterPromptInstallation(callback) {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    evenementInstallDiffere = event;
    callback(true);
  });
}

export async function declencherInstallation() {
  if (!evenementInstallDiffere) return false;
  evenementInstallDiffere.prompt();
  const resultat = await evenementInstallDiffere.userChoice;
  evenementInstallDiffere = null;
  return resultat.outcome === "accepted";
}
