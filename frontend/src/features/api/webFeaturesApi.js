import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
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
      const r = await api.get(endpoints.referentials.anneesUniversitaires, {
        params: { actif: true },
      });
      return results(r.data);
    }, [], `GET ${endpoints.referentials.anneesUniversitaires}`);
  },
};

export const studentApi = {
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get(endpoints.demande.listCreate, { params });
      return { results: results(r.data) };
    }, { results: [] }, `GET ${endpoints.demande.listCreate}`);
  },
  async createDossier(payload) {
    const r = await api.post(endpoints.demande.listCreate, payload);
    return r.data;
  },
  async updateDossier(id, payload) {
    const r = await api.patch(endpoints.demande.detail(id), payload);
    return r.data;
  },
  async listDocuments(dossierId) {
    const r = await api.get(endpoints.documents.list, { params: { dossier: dossierId } });
    return results(r.data);
  },
  async uploadDocument({ dossier, type_piece, fichier }) {
    const form = new FormData();
    form.append("dossier", dossier);
    form.append("type_piece", type_piece);
    form.append("fichier", fichier);
    const r = await api.post(endpoints.documents.upload, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
  async listPaiements() {
    return withFallback(async () => {
      const r = await api.get(endpoints.etudiant.paiements);
      return results(r.data);
    }, [], `GET ${endpoints.etudiant.paiements}`);
  },
  async listReclamations() {
    return withFallback(async () => {
      const r = await api.get(endpoints.etudiant.reclamations);
      return results(r.data);
    }, [], `GET ${endpoints.etudiant.reclamations}`);
  },
};

export const adminApi = {
  async getDashboard(annee) {
    return withFallback(async () => {
      const r = await api.get(endpoints.admin.dashboard, {
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
    }, `GET ${endpoints.admin.dashboard}`);
  },
  async listDossiers(params = {}) {
    return withFallback(async () => {
      const r = await api.get(endpoints.admin.dossiers, { params });
      return results(r.data);
    }, [], `GET ${endpoints.admin.dossiers}`);
  },
  async updateDossier(id, payload) {
    const r = await api.patch(endpoints.admin.dossierDetail(id), payload);
    return r.data;
  },
  async sendDossierToMauripost(id, payload = {}) {
    const r = await api.post(endpoints.admin.envoyerMauripost(id), payload);
    return r.data;
  },
  async listPaiements(params = {}) {
    return withFallback(async () => {
      const r = await api.get(endpoints.admin.paiements, { params });
      return results(r.data);
    }, [], `GET ${endpoints.admin.paiements}`);
  },
  async exportPaiementsXlsx(annee) {
    return withFallback(async () => {
      const r = await api.get(endpoints.admin.exportPaiementsXlsx, {
        params: annee ? { annee_universitaire: annee } : {},
        responseType: "blob",
      });
      return r.data;
    }, new Blob(["Fallback export indisponible côté backend."], { type: "text/plain;charset=utf-8" }), `GET ${endpoints.admin.exportPaiementsXlsx}`);
  },
  async listUsers() {
    return withFallback(async () => {
      const r = await api.get(endpoints.admin.users);
      return results(r.data);
    }, adminUsers, `GET ${endpoints.admin.users}`);
  },
  async updateUser(id, payload) {
    const r = await api.patch(endpoints.admin.userDetail(id), payload);
    return r.data;
  },
  async createStudentUser(payload) {
    const r = await api.post(endpoints.admin.users, payload);
    return r.data;
  },
  async deleteUser(id) {
    await api.delete(endpoints.admin.userDetail(id));
    return true;
  },
  async importUsersCsv(file) {
    const form = new FormData();
    form.append("file", file);
    const r = await api.post(endpoints.admin.usersImportCsv, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return r.data;
  },
};

export const partnerApi = {
  async listOperationalPaiements() {
    return withFallback(async () => {
      const r = await api.get(endpoints.mauriposte.dossiers);
      return results(r.data);
    }, () => {
      const first = partnerBatches[0];
      return [
        { id: 1, dossier_id: 101, liste_reference: first.id, montant: 32000, statut: "ENVOYE" },
        { id: 2, dossier_id: 102, liste_reference: first.id, montant: 32000, statut: "ENVOYE" },
      ];
    }, `GET ${endpoints.mauriposte.dossiers}`);
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
    const r = await api.post(endpoints.mauriposte.paiement, { operations });
    return r.data;
  },
};

