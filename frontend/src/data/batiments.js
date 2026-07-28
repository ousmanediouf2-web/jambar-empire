// Le serveur calcule et renvoie desormais tous les couts et durees.
// Ce module ne garde que le formatage d'affichage.

export function formaterDuree(secondes) {
  if (secondes === undefined || secondes === null) return "-";
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  const s = Math.floor(secondes % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
