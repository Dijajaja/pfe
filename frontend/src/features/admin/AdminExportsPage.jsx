import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";

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
      const csvRows = rows.map((p) => `${p.id},${p.dossier || p.dossier_id},${p.statut},${p.montant || 0}`);
      return new Blob([["id,dossier,statut,montant", ...csvRows].join("\n")], { type: "text/csv;charset=utf-8" });
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
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Exports</h1>
        <div className="text-muted">Téléchargement des relevés avec suivi d’export.</div>
      </div>
      <div className="col-12 col-xl-8">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="fw-bold">Exports disponibles</div>
            <button className="btn btn-sm sehily-btn-secondary" onClick={() => pushInfo("Les exports utilisent les données en temps réel.")}>
              Info
            </button>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn sehily-btn-accent d-flex align-items-center gap-2" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
              Télécharger Excel
            </button>
            <button className="btn sehily-btn-secondary d-flex align-items-center gap-2" onClick={() => csvMutation.mutate()} disabled={csvMutation.isPending}>
              {csvMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
              Télécharger CSV
            </button>
          </div>
          <div className="small text-muted mt-2">
            Total paiements: {stats.total} | Effectués: {stats.effectues} | En attente: {stats.enAttente}
          </div>
        </div>
      </div>
      <div className="col-12 col-xl-4">
        <div className="sehily-surface p-3">
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
              Actualisation en cours...
            </div>
          ) : null}
        </div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Aperçu paiements exportables</div>
          <div className="table-responsive">
            <table className="table table-sm align-middle admin-table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dossier</th>
                  <th>Statut</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {(paiementsQuery.data || []).slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.dossier || p.dossier_id || "-"}</td>
                    <td>{p.statut}</td>
                    <td>{Number(p.montant || 0).toLocaleString()} MRU</td>
                  </tr>
                ))}
                {!(paiementsQuery.data || []).length ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Aucun paiement disponible
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

