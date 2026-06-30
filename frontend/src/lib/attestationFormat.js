import { getEtablissementAbbreviation } from "../data/mauritanieUniversite.js";

/** Abréviation établissement pour l'attestation (ex. ISCAE). */
export function abbreviateEtablissement(value) {
  return getEtablissementAbbreviation(value);
}

export function formatEmissionDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
