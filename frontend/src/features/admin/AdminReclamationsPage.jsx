import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

const STATUS_OPTIONS = [
  "SOUMISE",
  "EN_COURS",
  "EN_ATTENTE_ETUDIANT",
  "TRAITEE",
  "REJETEE",
];

export function AdminReclamationsPage() {
  const queryClient = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const reclamationsQuery = useQuery({
    queryKey: ["admin", "reclamations"],
    queryFn: () => adminApi.listReclamations(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, statut }) => adminApi.updateReclamation(id, { statut }),
    onSuccess: () => {
      pushSuccess("Statut de réclamation mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin", "reclamations"] });
    },
    onError: (error) => {
      pushError(getApiErrorMessage(error, "Échec de mise à jour de la réclamation."));
    },
  });

  const rows = useMemo(() => {
    const source = reclamationsQuery.data || [];
    if (statusFilter === "ALL") return source;
    return source.filter((r) => r.statut === statusFilter);
  }, [reclamationsQuery.data, statusFilter]);

  function onStatusChange(id, statut) {
    updateMutation.mutate({ id, statut });
  }

  if (reclamationsQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div>
            <h1 className="h4 mb-1">Gestion des réclamations étudiants</h1>
            <div className="text-muted">Suivez et mettez à jour l'état des réclamations.</div>
          </div>
          <select className="form-select form-select-sm" style={{ maxWidth: 240 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tous statuts</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          {reclamationsQuery.error ? (
            <div className="alert alert-danger py-2">
              {getApiErrorMessage(reclamationsQuery.error, "Impossible de charger les réclamations.")}
            </div>
          ) : null}
          <div className="table-responsive">
            <table className="table table-sm align-middle admin-table-pro admin-table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Étudiant</th>
                  <th>Objet</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>REC-{String(row.id).padStart(6, "0")}</td>
                      <td>{row.etudiant || "-"}</td>
                      <td>{row.objet}</td>
                      <td style={{ minWidth: 260 }}>{row.description}</td>
                      <td>{new Date(row.date_creation).toLocaleString()}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.statut}
                          disabled={updateMutation.isPending}
                          onChange={(e) => onStatusChange(row.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Aucune réclamation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

