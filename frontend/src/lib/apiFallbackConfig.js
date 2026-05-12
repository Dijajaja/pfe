/**
 * Données mock / fallback pour certaines routes (voir `webFeaturesApi.withFallback`).
 *
 * - **Production** : laisser `VITE_ENABLE_API_FALLBACK` absent ou à `false` pour que les erreurs
 *   HTTP (404, 5xx, réseau) remontent à l’UI au lieu d’être masquées par des jeux de démo.
 * - **Développement / démo** : `VITE_ENABLE_API_FALLBACK=true` uniquement si vous travaillez sans backend Django.
 *
 * La valeur est figée au build Vite (`import.meta.env`).
 */
export function isApiFallbackEnabled() {
  return String(import.meta.env.VITE_ENABLE_API_FALLBACK || "").toLowerCase() === "true";
}
