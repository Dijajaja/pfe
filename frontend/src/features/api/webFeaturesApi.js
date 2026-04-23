import { api } from "../../lib/api";
import { adminKpis, adminUsers, partnerBatches } from "../data/mockData";
import { shouldUseFallback } from "../../lib/apiError";
import { markFallbackEndpoint } from "../../app/fallbackMode";

const API_FALLBACK_ENABLED = import.meta.env.VITE_ENABLE_API_FALLBACK === "true";

function results(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

async function withFallback(requestFn, fallbackValue, endpointTag) {
  try {
    return await requestFn();
  } catch (error) {
    if (API_FALLBACK_ENABLED && shouldUseFallback(error) && typeof fallbackValue !== "undefined") {
      markFallbackEndpoint(endpointTag);
      return typeof fallbackValue === "function" ? fallbackValue() : fallbackValue;
    }
    throw error;
  }
}

export const referentialApi = {
  async listAnneesActives() {
    return withFallback(async () => {
      const r = await api.get("/api/referentiels/annees-universitaires/", {
        params: { actif: true },
      });
      return results(r.data);
    }, [], "GET /api/referentiels/annees-universitaires/");
  },
};

export const studentApi = {
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/demande/", { params });
      return { results: results(r.data) };
    }, { results: [] }, "GET /api/demande/");
  },
  async createDossier(payload) {
    const r = await api.post("/api/demande/", payload);
    return r.data;
  },
  async updateDossier(id, payload) {
    const r = await api.patch(`/api/demande/${id}/`, payload);
    return r.data;
  },
  async listDocuments(dossierId) {
    const r = await api.get("/api/documents/", { params: { dossier: dossierId } });
    return results(r.data);
  },
  async uploadDocument({ dossier, type_piece, fichier }) {
    const form = new FormData();
    form.append("dossier", dossier);
    form.append("type_piece", type_piece);
    form.append("fichier", fichier);
    const r = await api.post("/api/documents/upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
  async listPaiements() {
    return withFallback(async () => {
      const r = await api.get("/api/etudiant/paiements/");
      return results(r.data);
    }, [], "GET /api/etudiant/paiements/");
  },
  async listReclamations() {
    return withFallback(async () => {
      const r = await api.get("/api/etudiant/reclamations/");
      return results(r.data);
    }, [], "GET /api/etudiant/reclamations/");
  },
};

export const adminApi = {
  async getDashboard(annee) {
    return withFallback(async () => {
      const r = await api.get("/api/admin/reports/dashboard/", {
        params: annee ? { annee_universitaire: annee } : {},
      });
      return r.data;
    }, {
      dossiers: {
        total: adminKpis.totalDossiers,
        SOUMIS: adminKpis.enAttente,
        VALIDE: adminKpis.valides,
        REJETE: adminKpis.rejetes,
      },
      paiements: {
        total: adminKpis.paiementsEffectues + 50,
        EFFECTUE: adminKpis.paiementsEffectues,
      },
    }, "GET /api/admin/reports/dashboard/");
  },
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/admin/dossiers/", { params });
      return results(r.data);
    }, [], "GET /api/admin/dossiers/");
  },
  async updateDossier(id, payload) {
    const r = await api.patch(`/api/admin/dossiers/${id}/`, payload);
    return r.data;
  },
  async sendDossierToMauripost(id, payload = {}) {
    const r = await api.post(`/api/admin/dossiers/${id}/envoyer-mauripost/`, payload);
    return r.data;
  },
  async listPaiements(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/admin/paiements/", { params });
      return results(r.data);
    }, [], "GET /api/admin/paiements/");
  },
  async exportPaiementsXlsx(annee) {
    return withFallback(async () => {
      const r = await api.get("/api/admin/exports/paiements.xlsx", {
        params: annee ? { annee_universitaire: annee } : {},
        responseType: "blob",
      });
      return r.data;
    }, new Blob(["Fallback export indisponible côté backend."], { type: "text/plain;charset=utf-8" }), "GET /api/admin/exports/paiements.xlsx");
  },
  async listUsers() {
    return withFallback(async () => {
      const r = await api.get("/api/admin/users/");
      return results(r.data);
    }, adminUsers, "GET /api/admin/users/");
  },
  async updateUser(id, payload) {
    const r = await api.patch(`/api/admin/users/${id}/`, payload);
    return r.data;
  },
  async importUsersCsv(file) {
    const form = new FormData();
    form.append("file", file);
    const r = await api.post("/api/admin/users/import-csv/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
};

export const partnerApi = {
  async listOperationalPaiements() {
    return withFallback(async () => {
      const r = await api.get("/api/mauriposte/dossiers/");
      return results(r.data);
    }, () => {
      const first = partnerBatches[0];
      return [
        { id: 1, dossier_id: 101, liste_reference: first.id, montant: 32000, statut: "ENVOYE" },
        { id: 2, dossier_id: 102, liste_reference: first.id, montant: 32000, statut: "ENVOYE" },
      ];
    }, "GET /api/mauriposte/dossiers/");
  },
  async getListeByReference(reference) {
    const rows = await this.listOperationalPaiements();
    if (!reference) return { reference: null, paiements: rows };
    return {
      reference,
      paiements: rows.filter((p) => String(p.liste_reference || "") === String(reference)),
    };
  },
  async confirmPaiements(operations) {
    const r = await api.post("/api/mauriposte/paiement/", { operations });
    return r.data;
  },
};

