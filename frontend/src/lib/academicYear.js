const START_LABEL = "2024-2025";

/** @returns {string} ex. "2025-2026" */
export function getCurrentAcademicYearLabel(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month < 10) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}

/** Année universitaire précédente (AAAA-AAAA). */
export function getPreviousAcademicYearLabel(label) {
  const start = Number(String(label).split("-")[0]);
  if (!Number.isFinite(start)) return START_LABEL;
  return `${start - 1}-${start}`;
}

/** Liste décroissante de 2024-2025 jusqu'à l'année courante incluse. */
export function listAcademicYearLabels(date = new Date()) {
  const current = getCurrentAcademicYearLabel(date);
  const endStart = Number(current.split("-")[0]);
  const startStart = Number(START_LABEL.split("-")[0]);
  const labels = [];
  for (let y = startStart; y <= endStart; y += 1) {
    labels.push(`${y}-${y + 1}`);
  }
  return labels.reverse();
}

/** Valeur par défaut au chargement : année précédente par rapport à la courante. */
export function getDefaultAcademicYearLabel(date = new Date()) {
  return getPreviousAcademicYearLabel(getCurrentAcademicYearLabel(date));
}
