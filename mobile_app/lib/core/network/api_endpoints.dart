/// Chemins API alignés sur `pfe/frontend/src/lib/endpoints.js` et Django alias URLs.
abstract final class ApiEndpoints {
  static const authLogin = '/auth/login/';
  static const authRegister = '/auth/register/';
  static const authRefresh = '/auth/refresh/';
  static const authMe = '/auth/me/';
  static const authPasswordReset = '/auth/password-reset/';

  static const anneesUniversitaires = '/referentiels/annees-universitaires/';
  static const demande = '/demande/';
  static String demandeDetail(int id) => '/demande/$id/';
  static const documents = '/documents/';
  static const documentsUpload = '/documents/upload/';

  static const etudiantPaiements = '/etudiant/paiements/';
  static const etudiantAttestation = '/etudiant/attestation/';
  static const etudiantAttestationPaiement = '/etudiant/attestation/paiement/';
  static const etudiantReclamations = '/etudiant/reclamations/';
  static String etudiantReclamationDetail(int id) => '/etudiant/reclamations/$id/';

  static const publicEligibilite = '/public/eligibilite/';
}
