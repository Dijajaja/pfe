import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiDownload, FiRefreshCw } from "react-icons/fi";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { getApiErrorMessage } from "../../lib/apiError";
import { exportBoursiersPdf } from "../../lib/exportBoursiersPdf";
import { exportBoursiersXlsx } from "../../lib/exportBoursiersXlsx";
import {
  getDefaultAcademicYearLabel,
  listAcademicYearLabels,
} from "../../lib/academicYear";
import { api } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";

const PAIEMENT_LABELS = {
  EFFECTUE: "Effectué",
  ENVOYE: "Envoyé",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ECHEC: "Échec",
};

function results(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

function paiementLabel(statut) {
  if (!statut || statut === "EN_ATTENTE") return "En attente";
  return PAIEMENT_LABELS[statut] || statut;
}

function isPendingPaiement(statut) {
  return statut !== "EFFECTUE";
}

function BoursierPaiementBadge({ statut, label }) {
  if (statut === "EFFECTUE") {
    return <StatusBadge status={statut} labelMap={PAIEMENT_LABELS} />;
  }
  if (statut === "ECHEC") {
    return <StatusBadge status={statut} labelMap={PAIEMENT_LABELS} />;
  }
  return <span className="sehily-badge sehily-badge--coral">{label}</span>;
}

export function AdminBoursiersPage() {
  const { t } = useTranslation();
  const { pushError, pushSuccess } = useAppToast();
  const yearOptions = useMemo(() => listAcademicYearLabels(), []);
  const [anneeLibelle, setAnneeLibelle] = useState(() => getDefaultAcademicYearLabel());
  const [etablissementFilter, setEtablissementFilter] = useState("ALL");
  const [exporting, setExporting] = useState(null);

  const anneesQuery = useQuery({
    queryKey: ["referentials", "annees", "admin-boursiers"],
    queryFn: async () => {
      const r = await api.get(endpoints.referentials.anneesUniversitaires);
      return results(r.data);
    },
  });

  const anneeId = useMemo(() => {
    const rows = anneesQuery.data || [];
    const match = rows.find((a) => a.libelle === anneeLibelle);
    return match?.id ?? null;
  }, [anneesQuery.data, anneeLibelle]);

  const boursiersQuery = useQuery({
    queryKey: ["admin", "boursiers", anneeLibelle, anneeId],
    queryFn: () => {
      if (anneeId == null) return Promise.resolve([]);
      return adminApi.listBoursiers({ annee_universitaire: anneeId });
    },
    enabled: anneesQuery.isSuccess,
  });

  const rows = useMemo(() => {
    const data = boursiersQuery.data;
    if (!Array.isArray(data)) return [];
    return data.map((row) => ({
      ...row,
      statut_paiement_label: paiementLabel(row.statut_paiement),
    }));
  }, [boursiersQuery.data]);

  const etablissements = useMemo(() => {
    const set = new Set(rows.map((r) => r.etablissement).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (etablissementFilter === "ALL") return rows;
    return rows.filter((r) => r.etablissement === etablissementFilter);
  }, [rows, etablissementFilter]);

  async function handleExportPdf() {
    if (!filteredRows.length) {
      pushError(t("adminBoursiersExportEmpty"));
      return;
    }
    setExporting("pdf");
    try {
      await exportBoursiersPdf(filteredRows, {
        etablissement: etablissementFilter,
        anneeUniversitaire: anneeLibelle,
      });
      pushSuccess(t("adminBoursiersExportPdfOk"));
    } catch {
      pushError(t("adminBoursiersExportPdfError"));
    } finally {
      setExporting(null);
    }
  }

  function handleExportExcel() {
    if (!filteredRows.length) {
      pushError(t("adminBoursiersExportEmpty"));
      return;
    }
    setExporting("xlsx");
    try {
      exportBoursiersXlsx(filteredRows, {
        etablissement: etablissementFilter,
        anneeUniversitaire: anneeLibelle,
      });
      pushSuccess(t("adminBoursiersExportXlsxOk"));
    } catch {
      pushError(t("adminBoursiersExportXlsxError"));
    } finally {
      setExporting(null);
    }
  }

  if (anneesQuery.isLoading || boursiersQuery.isLoading) return <LoadingSkeleton lines={8} />;
  if (boursiersQuery.error) {
    return (
      <div className="alert alert-danger">
        {getApiErrorMessage(boursiersQuery.error, t("adminBoursiersLoadError"))}
      </div>
    );
  }

  return (
    <div className="admin-boursiers-page">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4 admin-boursiers-header">
        <div>
          <h1 className="h4 mb-1 admin-boursiers-title">{t("adminBoursiersTitle")}</h1>
          <p className="text-muted mb-0">{t("adminBoursiersSubtitle")}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm sehily-btn-secondary d-inline-flex align-items-center gap-2"
            onClick={() => boursiersQuery.refetch()}
            disabled={boursiersQuery.isFetching}
          >
            <FiRefreshCw size={14} />
            {t("adminBoursiersRefresh")}
          </button>
          <button
            type="button"
            className="btn btn-sm sehily-btn-secondary d-inline-flex align-items-center gap-2"
            onClick={handleExportPdf}
            disabled={exporting === "pdf"}
          >
            <FiDownload size={14} />
            {t("adminBoursiersExportPdf")}
          </button>
          <button
            type="button"
            className="btn btn-sm sehily-btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleExportExcel}
            disabled={exporting === "xlsx"}
          >
            <FiDownload size={14} />
            {t("adminBoursiersExportExcel")}
          </button>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="sehily-surface p-3 admin-boursiers-stat">
            <div className="admin-boursiers-stat-label">{t("adminBoursiersStatTotal")}</div>
            <div className="admin-boursiers-stat-value">{rows.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="sehily-surface p-3 admin-boursiers-stat">
            <div className="admin-boursiers-stat-label">{t("adminBoursiersStatFiltered")}</div>
            <div className="admin-boursiers-stat-value admin-boursiers-stat-value--accent">{filteredRows.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="sehily-surface p-3 admin-boursiers-stat">
            <div className="admin-boursiers-stat-label">{t("adminBoursiersStatPaid")}</div>
            <div className="admin-boursiers-stat-value admin-boursiers-stat-value--ok">
              {filteredRows.filter((r) => r.statut_paiement === "EFFECTUE").length}
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="sehily-surface p-3 admin-boursiers-stat admin-boursiers-stat--pending">
            <div className="admin-boursiers-stat-label">{t("adminBoursiersStatPending")}</div>
            <div className="admin-boursiers-stat-value admin-boursiers-stat-value--coral">
              {filteredRows.filter((r) => isPendingPaiement(r.statut_paiement)).length}
            </div>
          </div>
        </div>
      </div>

      <div className="sehily-surface p-3 mb-3 admin-boursiers-filters-panel">
        <div className="admin-dossiers-filters admin-boursiers-filters d-flex flex-wrap align-items-end gap-3">
          <div style={{ minWidth: 220, maxWidth: 360 }}>
            <label className="form-label small fw-semibold mb-1 admin-boursiers-filter-label" htmlFor="boursiers-etablissement">
              {t("adminBoursiersFilterEtablissement")}
            </label>
            <select
              id="boursiers-etablissement"
              className="form-select form-select-sm admin-boursiers-filter-select"
              value={etablissementFilter}
              onChange={(e) => setEtablissementFilter(e.target.value)}
            >
              <option value="ALL">{t("adminBoursiersFilterAll")}</option>
              {etablissements.map((etab) => (
                <option key={etab} value={etab}>
                  {etab}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 200, maxWidth: 280 }}>
            <label className="form-label small fw-semibold mb-1 admin-boursiers-annee-label" htmlFor="boursiers-annee-universitaire">
              {t("adminBoursiersAnneeLabel")}
            </label>
            <select
              id="boursiers-annee-universitaire"
              className="form-select form-select-sm admin-boursiers-annee-select"
              value={anneeLibelle}
              onChange={(e) => setAnneeLibelle(e.target.value)}
            >
              {yearOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sehily-surface p-0 admin-dossiers-table-wrap admin-boursiers-table-wrap overflow-auto">
        <table className="table table-hover align-middle mb-0 admin-boursiers-table">
          <thead>
            <tr>
              <th>{t("adminBoursiersColName")}</th>
              <th>{t("adminBoursiersColNni")}</th>
              <th>{t("adminBoursiersColEtab")}</th>
              <th>{t("adminBoursiersColFiliere")}</th>
              <th>{t("adminBoursiersColNiveau")}</th>
              <th className="text-end">{t("adminBoursiersColMontant")}</th>
              <th>{t("adminBoursiersColPaiement")}</th>
            </tr>
          </thead>
          <tbody>
            {anneeId == null ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {t("adminBoursiersAnneeMissing", { annee: anneeLibelle })}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {t("adminBoursiersEmpty")}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td className="fw-semibold">{row.nom_complet || "—"}</td>
                  <td>{row.nni || "—"}</td>
                  <td>{row.etablissement || "—"}</td>
                  <td>{row.filiere || "—"}</td>
                  <td>{row.niveau || "—"}</td>
                  <td className="text-end text-nowrap">{Math.round(Number(row.montant_bourse || 0))} MRU</td>
                  <td>
                    <BoursierPaiementBadge
                      statut={row.statut_paiement}
                      label={row.statut_paiement_label}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
