/**
 * Chemins HTTP alignés sur le backend Django :
 * `backend/config/api_alias_urls.py` (préfixe global `/api/`).
 *
 * L’auth JWT est aussi exposée sous `/api/v1/auth/*` ; le front utilise les alias stables.
 * Mot de passe oublié : `POST /api/auth/password-reset/` avec `{ "email": "..." }`.
 */

export const endpoints = {
  auth: {
    register: "/api/auth/register/",
    login: "/api/auth/login/",
    refresh: "/api/auth/refresh/",
    me: "/api/auth/me/",
    /** POST { email } — demande de réinitialisation (e-mail à brancher en prod). */
    passwordResetRequest: "/api/auth/password-reset/",
  },
  referentials: {
    anneesUniversitaires: "/api/referentiels/annees-universitaires/",
  },
  public: {
    eligibilite: "/api/public/eligibilite/",
  },
  etudiant: {
    eligibilite: "/api/etudiant/eligibilite/",
    paiements: "/api/etudiant/paiements/",
    attestation: "/api/etudiant/attestation/",
    attestationPaiement: "/api/etudiant/attestation/paiement/",
    reclamations: "/api/etudiant/reclamations/",
    reclamationDetail: (id) => `/api/etudiant/reclamations/${id}/`,
  },
  reclamations: {
    list: "/api/v1/reclamations/",
    detail: (id) => `/api/v1/reclamations/${id}/`,
  },
  demande: {
    listCreate: "/api/demande/",
    detail: (id) => `/api/demande/${id}/`,
  },
  documents: {
    list: "/api/documents/",
    upload: "/api/documents/upload/",
  },
  admin: {
    dossiers: "/api/admin/dossiers/",
    dossierDetail: (id) => `/api/admin/dossiers/${id}/`,
    envoyerMauripost: (dossierId) => `/api/admin/dossiers/${dossierId}/envoyer-mauripost/`,
    paiements: "/api/admin/paiements/",
    dashboard: "/api/admin/reports/dashboard/",
    exportPaiementsXlsx: "/api/admin/exports/paiements.xlsx",
    users: "/api/admin/users/",
    userDetail: (id) => `/api/admin/users/${id}/`,
    usersImportCsv: "/api/admin/users/import-csv/",
    boursiers: "/api/admin/boursiers/",
  },
  mauriposte: {
    dossiers: "/api/mauriposte/dossiers/",
    paiement: "/api/mauriposte/paiement/",
  },
};
