import { useEffect, useState } from "react";
import { ecouterPromptInstallation, declencherInstallation } from "../pwa";

const LIEN_APK = "https://github.com/<ton-compte>/<ton-repo>/releases/latest/download/senegambie.apk";
const LIEN_WINDOWS = "https://github.com/<ton-compte>/<ton-repo>/releases/latest/download/senegambie-setup.msi";

function detecterPlateforme() {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows/i.test(ua)) return "windows";
  return "inconnu";
}

function Telechargement() {
  const [plateforme, setPlateforme] = useState("inconnu");
  const [installationPwaDisponible, setInstallationPwaDisponible] = useState(false);

  useEffect(() => {
    setPlateforme(detecterPlateforme());
    ecouterPromptInstallation(setInstallationPwaDisponible);
  }, []);

  const carteStyle = (active) => ({
    border: active ? "2px solid #0F6E56" : "1px solid #D3D1C7",
    borderRadius: "12px",
    padding: "1.5rem",
    minWidth: "200px",
    textAlign: "center"
  });

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Telecharger Jambar Empire</h1>
      <p>Choisis ta plateforme. Ton appareil detecte : <strong>{plateforme}</strong></p>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "2rem" }}>
        <div style={carteStyle(plateforme === "android")}>
          <h3>Android</h3>
          <p>Fichier APK a installer directement (autoriser "sources inconnues" a l'installation).</p>
          <a href={LIEN_APK} download>
            <button>Telecharger l'APK</button>
          </a>
        </div>

        <div style={carteStyle(plateforme === "ios")}>
          <h3>iOS (iPhone / iPad)</h3>
          <p>
            Ouvre ce site dans <strong>Safari</strong>, appuie sur le bouton de partage,
            puis "Ajouter a l'ecran d'accueil". L'application s'installe comme une app native.
          </p>
          {installationPwaDisponible && (
            <button onClick={declencherInstallation}>Installer maintenant</button>
          )}
        </div>

        <div style={carteStyle(plateforme === "windows")}>
          <h3>Windows</h3>
          <p>Installeur .msi. Windows peut afficher un avertissement "editeur non reconnu" : clique "Plus d'infos" puis "Executer quand meme".</p>
          <a href={LIEN_WINDOWS} download>
            <button>Telecharger pour Windows</button>
          </a>
        </div>
      </div>

      {installationPwaDisponible && plateforme !== "ios" && (
        <div style={{ marginTop: "2rem" }}>
          <p>Ton navigateur propose aussi une installation en un clic :</p>
          <button onClick={declencherInstallation}>Installer l'application web</button>
        </div>
      )}
    </div>
  );
}

export default Telechargement;
