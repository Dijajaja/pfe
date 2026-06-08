class DossierSubmissionValidation {
  const DossierSubmissionValidation({required this.ok, required this.missing});

  final bool ok;
  final List<String> missing;
}

int countPhoneDigits(String value) {
  return value.replaceAll(RegExp(r'\D'), '').length;
}

DossierSubmissionValidation validateDossierSubmission({
  required String numeroCni,
  required String telephone,
  required String niveau,
  int? anneeUniversitaireId,
  required int existingDocumentsCount,
  required int pendingFilesCount,
}) {
  final missing = <String>[];
  if (numeroCni.trim().isEmpty) missing.add('Numéro CNI');
  if (countPhoneDigits(telephone) < 8) {
    missing.add('Numéro de téléphone (8 chiffres minimum)');
  }
  if (niveau.trim().isEmpty) missing.add('Niveau d\'étude');
  if (anneeUniversitaireId == null) missing.add('Année universitaire');
  if (existingDocumentsCount + pendingFilesCount < 1) {
    missing.add('Au moins une pièce justificative');
  }
  return DossierSubmissionValidation(ok: missing.isEmpty, missing: missing);
}

bool canSubmitDossierStatut(String? statut) {
  if (statut == null || statut.isEmpty) return true;
  return statut.toUpperCase() == 'BROUILLON';
}

bool canEditReclamation(String statut) {
  return statut == 'SOUMISE' || statut == 'EN_ATTENTE_ETUDIANT';
}

bool canDeleteReclamation(String statut) => statut == 'SOUMISE';
