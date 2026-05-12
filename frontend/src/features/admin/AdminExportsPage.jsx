import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAIEMENT_STATUS_LABELS = {
  EFFECTUE: "Effectué",
  ENVOYE: "Envoyé",
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ECHEC: "Échec",
};

function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminExportsPage() {
  const { pushSuccess, pushError, pushInfo } = useAppToast();
  const [history, setHistory] = useState([]);
  const paiementsQuery = useQuery({
    queryKey: ["admin", "paiements", "exports"],
    queryFn: () => adminApi.listPaiements(),
  });

  const exportMutation = useMutation({
    mutationFn: () => adminApi.exportPaiementsXlsx(),
    onSuccess: (blob) => {
      download("export_paiements.xlsx", blob);
      pushSuccess("Export téléchargé.");
      setHistory((prev) => [
        { id: Date.now(), type: "XLSX", date: new Date().toLocaleString("fr-FR"), detail: "Export paiements .xlsx" },
        ...prev,
      ]);
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec export paiements.")),
  });

  const csvMutation = useMutation({
    mutationFn: async () => {
      const rows = paiementsQuery.data || [];
      const header = "id,dossier,etudiant,statut,montant";
      const csvRows = rows.map((p) => {
        const id = p.id;
        const dossier = p.dossier ?? p.dossier_id ?? "";
        const etu = p.etudiant_email ?? "";
        const statut = p.statut ?? "";
        const montant = p.montant ?? 0;
        return `${id},${dossier},"${String(etu).replace(/"/g, '""')}",${statut},${montant}`;
      });
      return new Blob([[header, ...csvRows].join("\n")], { type: "text/csv;charset=utf-8" });
    },
    onSuccess: (blob) => {
      download("export_paiements.csv", blob);
      pushSuccess("Export CSV téléchargé.");
      setHistory((prev) => [
        { id: Date.now(), type: "CSV", date: new Date().toLocaleString("fr-FR"), detail: "Export paiements .csv" },
        ...prev,
      ]);
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec export CSV.")),
  });

  const stats = useMemo(() => {
    const rows = paiementsQuery.data || [];
    return {
      total: rows.length,
      effectues: rows.filter((p) => p.statut === "EFFECTUE").length,
      enAttente: rows.filter((p) => p.statut !== "EFFECTUE").length,
    };
  }, [paiementsQuery.data]);

  if (paiementsQuery.isLoading) return <LoadingSkeleton lines={6} />;
  if (paiementsQuery.isError) return <div className="alert alert-danger">{getApiErrorMessage(paiementsQuery.error, "Impossible de charger les données export.")}</div>;

  return (
    <div className="admin-exports-page">
      <div className="mb-3">
        <h1 className="h4 mb-1">Admin — Exports</h1>
        <div className="text-muted">Téléchargement des relevés avec suivi d’export.</div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card">
            <div className="admin-dossiers-stat-label">Total</div>
            <div className="admin-dossiers-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--ok">
            <div className="admin-dossiers-stat-label">Effectués</div>
            <div className="admin-dossiers-stat-value">{stats.effectues}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--pending">
            <div className="admin-dossiers-stat-label">En attente</div>
            <div className="admin-dossiers-stat-value">{stats.enAttente}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-7">
          <div className="sehily-surface p-3 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div className="fw-bold">Exports disponibles</div>
              <button type="button" className="btn btn-sm sehily-btn-secondary" onClick={() => pushInfo("Les exports utilisent les données en temps réel.")}>
                Info
              </button>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-auto">
              <button type="button" className="btn sehily-btn-accent" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
                Télécharger Excel
              </button>
              <button type="button" className="btn sehily-btn-secondary" onClick={() => csvMutation.mutate()} disabled={csvMutation.isPending}>
                {csvMutation.isPending ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
                Télécharger CSV
              </button>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-5">
          <div className="sehily-surface p-3 h-100">
            <div className="fw-bold mb-2">Historique des exports</div>
            {!history.length ? (
              <div className="text-muted small">Aucun export lancé dans cette session.</div>
            ) : (
              <div className="small d-grid gap-2">
                {history.slice(0, 8).map((h) => (
                  <div key={h.id} className="border rounded p-2">
                    <div className="fw-semibold">{h.type}</div>
                    <div>{h.detail}</div>
                    <div className="text-muted">{h.date}</div>
                  </div>
                ))}
              </div>
            )}
            {paiementsQuery.isFetching ? (
              <div className="d-flex align-items-center gap-2 small text-muted mt-2">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                Actualisation…
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sehily-surface p-3">
        <div className="fw-bold mb-2">Aperçu paiements exportables</div>
        <div className="table-responsive admin-dossiers-table-wrap">
          <table className="table table-sm align-middle admin-table-hover mb-0 admin-table-pro">
            <thead>
              <tr>
                <th>ID</th>
                <th>Dossier</th>
                <th>Étudiant</th>
                <th>Statut</th>
                <th className="text-end">Montant</th>
              </tr>
            </thead>
            <tbody>
              {(paiementsQuery.data || []).slice(0, 12).map((p) => (
                <tr key={p.id}>
                  <td className="text-nowrap">{p.id}</td>
                  <td className="text-nowrap">{p.dossier ?? p.dossier_id ?? "—"}</td>
                  <td>{p.etudiant_email || "—"}</td>
                  <td>
                    <StatusBadge status={p.statut} labelMap={PAIEMENT_STATUS_LABELS} />
                  </td>
                  <td className="text-end text-nowrap">{Number(p.montant || 0).toLocaleString()} MRU</td>
                </tr>
              ))}
              {!(paiementsQuery.data || []).length ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Aucun paiement disponible
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
