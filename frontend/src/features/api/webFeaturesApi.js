import { api } from "../../lib/api";
import { adminKpis, adminUsers, partnerBatches } from "../data/mockData";
import { shouldUseFallback } from "../../lib/apiError";
import { markFallbackEndpoint } from "../../app/fallbackMode";

function results(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

async function withFallback(requestFn, fallbackValue, endpointTag) {
  try {
    return await requestFn();
  } catch (error) {
    if (shouldUseFallback(error) && typeof fallbackValue !== "undefined") {
      markFallbackEndpoint(endpointTag);
      return typeof fallbackValue === "function" ? fallbackValue() : fallbackValue;
    }
    throw error;
  }
}

export const referentialApi = {
  async listAnneesActives() {
    return withFallback(async () => {
      const r = await api.get("/api/v1/annees-universitaires/", {
        params: { actif: true },
      });
      return results(r.data);
    }, [], "GET /api/v1/annees-universitaires/");
  },
};

export const studentApi = {
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/v1/dossiers/", { params });
      return r.data;
    }, { results: [] }, "GET /api/v1/dossiers/");
  },
  async createDossier(payload) {
    const r = await api.post("/api/v1/dossiers/", payload);
    return r.data;
  },
  async updateDossier(id, payload) {
    const r = await api.patch(`/api/v1/dossiers/${id}/`, payload);
    return r.data;
  },
  async listDocuments(dossierId) {
    const r = await api.get("/api/v1/documents/", { params: { dossier: dossierId } });
    return results(r.data);
  },
  async uploadDocument({ dossier, type_piece, fichier }) {
    const form = new FormData();
    form.append("dossier", dossier);
    form.append("type_piece", type_piece);
    form.append("fichier", fichier);
    const r = await api.post("/api/v1/documents/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
  async listPaiements() {
    return withFallback(async () => {
      const r = await api.get("/api/v1/me/paiements/");
      return results(r.data);
    }, [], "GET /api/v1/me/paiements/");
  },
  async listReclamations() {
    return withFallback(async () => {
      const r = await api.get("/api/v1/reclamations/");
      return results(r.data);
    }, [], "GET /api/v1/reclamations/");
  },
};

export const adminApi = {
  async getDashboard(annee) {
    return withFallback(async () => {
      const r = await api.get("/api/v1/admin/reports/dashboard/", {
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
    }, "GET /api/v1/admin/reports/dashboard/");
  },
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/v1/dossiers/", { params });
      return results(r.data);
    }, [], "GET /api/v1/dossiers/ (admin)");
  },
  async updateDossier(id, payload) {
    const r = await api.patch(`/api/v1/dossiers/${id}/`, payload);
    return r.data;
  },
  async listPaiements(params = {}) {
    return withFallback(async () => {
      const r = await api.get("/api/v1/admin/paiements/", { params });
      return results(r.data);
    }, [], "GET /api/v1/admin/paiements/");
  },
  async exportPaiementsXlsx(annee) {
    return withFallback(async () => {
      const r = await api.get("/api/v1/admin/exports/paiements.xlsx", {
        params: annee ? { annee_universitaire: annee } : {},
        responseType: "blob",
      });
      return r.data;
    }, new Blob(["Fallback export indisponible côté backend."], { type: "text/plain;charset=utf-8" }), "GET /api/v1/admin/exports/paiements.xlsx");
  },
  async listUsers() {
    return withFallback(async () => {
      const r = await api.get("/api/v1/users/");
      return results(r.data);
    }, adminUsers, "GET /api/v1/users/");
  },
};

export const partnerApi = {
  async getListeByReference(reference) {
    return withFallback(async () => {
      const r = await api.get(`/api/v1/partner/listes/${reference}/`);
      return r.data;
    }, () => {
      const first = partnerBatches[0];
      return {
        id: first.id,
        reference: first.id,
        paiements: [
          { id: 1, dossier_id: 101, liste_reference: first.id, montant: 32000, statut: "EN_ATTENTE" },
          { id: 2, dossier_id: 102, liste_reference: first.id, montant: 32000, statut: "EN_ATTENTE" },
        ],
      };
    }, "GET /api/v1/partner/listes/{reference}/");
  },
  async confirmPaiements(operations) {
    const r = await api.post("/api/v1/partner/paiements/confirmer/", { operations });
    return r.data;
  },
};

