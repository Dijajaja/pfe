import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const STATUS_OPTIONS = ["SOUMISE", "EN_COURS", "EN_ATTENTE_ETUDIANT", "TRAITEE", "REJETEE"];

const STATUS_LABELS = {
  SOUMISE: "Soumise",
  EN_COURS: "En cours",
  EN_ATTENTE_ETUDIANT: "Attente étudiant",
  TRAITEE: "Traitée",
  REJETEE: "Rejetée",
};

const STATUS_BADGE_CLASS = {
  SOUMISE: "sehily-badge sehily-badge--warn",
  EN_COURS: "sehily-badge sehily-badge--warn",
  EN_ATTENTE_ETUDIANT: "sehily-badge sehily-badge--warn",
  TRAITEE: "sehily-badge sehily-badge--ok",
  REJETEE: "sehily-badge sehily-badge--danger",
};

export function AdminReclamationsPage() {
  const queryClient = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [textQuery, setTextQuery] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) setTextQuery(q);
  }, [searchParams]);

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

  const allRows = useMemo(() => reclamationsQuery.data || [], [reclamationsQuery.data]);

  const stats = useMemo(
    () => ({
      total: allRows.length,
      traitees: allRows.filter((r) => r.statut === "TRAITEE").length,
      enAttente: allRows.filter((r) => r.statut !== "TRAITEE").length,
    }),
    [allRows],
  );

  const rows = useMemo(() => {
    const statusBase = statusFilter === "ALL" ? allRows : allRows.filter((r) => r.statut === statusFilter);
    const needle = textQuery.trim().toLowerCase();
    if (!needle) return statusBase;
    return statusBase.filter((r) =>
      `${r.id} ${r.etudiant_email || ""} ${r.etudiant || ""} ${r.objet || ""} ${r.description || ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [allRows, statusFilter, textQuery]);

  function onStatusChange(id, statut) {
    updateMutation.mutate({ id, statut });
  }

  if (reclamationsQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  const emptyDatabase = !allRows.length;
  const emptyFilter = allRows.length > 0 && !rows.length;
  const emptySearch = Boolean(textQuery.trim()) && emptyFilter;

  return (
    <div className="admin-reclamations-page">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">Gestion des réclamations étudiants</h1>
          <div className="text-muted">Suivez et mettez à jour l’état des réclamations.</div>
        </div>
        <select
          className="form-select form-select-sm"
          style={{ minWidth: "11rem", maxWidth: "16rem" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="ALL">Tous statuts</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] || status}
            </option>
          ))}
        </select>
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
            <div className="admin-dossiers-stat-label">Traitées</div>
            <div className="admin-dossiers-stat-value">{stats.traitees}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--pending">
            <div className="admin-dossiers-stat-label">En attente</div>
            <div className="admin-dossiers-stat-value">{stats.enAttente}</div>
          </div>
        </div>
      </div>

      <div className="sehily-surface p-3">
        {reclamationsQuery.error ? (
          <div className="alert alert-danger py-2">{getApiErrorMessage(reclamationsQuery.error, "Impossible de charger les réclamations.")}</div>
        ) : null}

        {emptyDatabase ? (
          <div className="text-center py-5 px-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 admin-reclamations-empty-icon">
              <Inbox size={40} strokeWidth={1.35} className="text-muted" aria-hidden="true" />
            </div>
            <div className="fw-semibold mb-1">Aucune réclamation</div>
            <div className="small text-muted mx-auto" style={{ maxWidth: "28rem" }}>
              Lorsque les étudiants créent une réclamation, elle apparaîtra ici avec son statut et les actions possibles.
            </div>
          </div>
        ) : emptyFilter ? (
          <div className="text-center py-5 px-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 admin-reclamations-empty-icon">
              <Inbox size={40} strokeWidth={1.35} className="text-muted" aria-hidden="true" />
            </div>
            <div className="fw-semibold mb-1">{emptySearch ? "Aucun résultat pour cette recherche" : "Aucun résultat pour ce filtre"}</div>
            <div className="small text-muted">
              {emptySearch
                ? "Modifiez le terme de recherche ou le filtre de statut."
                : "Modifiez le filtre « Tous statuts » pour afficher d’autres réclamations."}
            </div>
          </div>
        ) : (
          <div className="table-responsive admin-dossiers-table-wrap">
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
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-nowrap">REC-{String(row.id).padStart(6, "0")}</td>
                    <td>{row.etudiant_email || row.etudiant || "—"}</td>
                    <td>{row.objet}</td>
                    <td style={{ minWidth: 220, maxWidth: 360 }}>{row.description}</td>
                    <td className="text-nowrap small">{new Date(row.date_creation).toLocaleString("fr-FR")}</td>
                    <td style={{ minWidth: 200 }}>
                      <div className="d-flex flex-column gap-2 align-items-start">
                        <StatusBadge status={row.statut} labelMap={STATUS_LABELS} classMap={STATUS_BADGE_CLASS} />
                        <select
                          className="form-select form-select-sm w-100"
                          value={row.statut}
                          disabled={updateMutation.isPending}
                          onChange={(e) => onStatusChange(row.id, e.target.value)}
                          aria-label={`Changer le statut de la réclamation ${row.id}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status] || status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
