/**
 * Valeurs alignées sur `dossiers.models.StatutDossier` (TextChoices Django).
 */
export const StatutDossier = {
  BROUILLON: "BROUILLON",
  SOUMIS: "SOUMIS",
  EN_INSTRUCTION: "EN_INSTRUCTION",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
  COMPLEMENT_DEMANDE: "COMPLEMENT_DEMANDE",
};

/**
 * Valeurs alignées sur `payments.models.StatutPaiement` (TextChoices Django).
 */
export const StatutPaiement = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_COURS: "EN_COURS",
  ENVOYE: "ENVOYE",
  EFFECTUE: "EFFECTUE",
  ECHEC: "ECHEC",
};

/**
 * Éligibilité attestation depuis la réponse API GET /api/etudiant/attestation/.
 * @param {{ eligible?: boolean } | null | undefined} status
 */
export function isAttestationEligibleFromStatus(status) {
  return Boolean(status?.eligible);
}

/**
 * Éligibilité attestation depuis un dossier (champs serializer).
 * @param {{ statut?: string, statut_paiement?: string | null } | null | undefined} dossier
 */
export function isAttestationEligible(dossier) {
  if (!dossier) return false;
  return (
    dossier.statut === StatutDossier.VALIDE &&
    dossier.statut_paiement === StatutPaiement.EFFECTUE
  );
}
