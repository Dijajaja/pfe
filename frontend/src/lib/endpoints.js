/**
 * Chemins HTTP alignés sur le backend Django :
 * `backend/config/api_alias_urls.py` (préfixe global `/api/`).
 *
 * L’auth JWT est aussi exposée sous `/api/v1/auth/*` ; le front utilise les alias stables.
 */

export const endpoints = {
  auth: {
    register: "/api/auth/register/",
    login: "/api/auth/login/",
    refresh: "/api/auth/refresh/",
    me: "/api/auth/me/",
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
    reclamations: "/api/etudiant/reclamations/",
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
  },
  mauriposte: {
    dossiers: "/api/mauriposte/dossiers/",
    paiement: "/api/mauriposte/paiement/",
  },
};
