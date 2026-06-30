const PHONE_MIN_DIGITS = 8;

export function countDigits(value) {
  return String(value || "").replace(/\D/g, "").length;
}

/**
 * Vérifie que le dossier peut être soumis (champs + au moins une pièce).
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function validateDossierSubmission({ numero_cni, telephone, niveau, anneeUniversitaireId, existingDocumentsCount, pendingFilesCount }) {
  const missing = [];

  if (!String(numero_cni || "").trim()) {
    missing.push("Numéro CNI");
  }
  if (countDigits(telephone) < PHONE_MIN_DIGITS) {
    missing.push("Numéro de téléphone (8 chiffres minimum)");
  }
  if (!String(niveau || "").trim()) {
    missing.push("Niveau d'étude");
  }
  const totalDocs = Number(existingDocumentsCount || 0) + Number(pendingFilesCount || 0);
  if (totalDocs < 1) {
    missing.push("Au moins une pièce justificative");
  }

  return { ok: missing.length === 0, missing };
}

export function canSubmitDossierStatut(statut) {
  if (!statut) return true;
  return String(statut).toUpperCase() === "BROUILLON";
}
