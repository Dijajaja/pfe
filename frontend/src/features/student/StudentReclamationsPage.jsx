import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiEdit2, FiInbox, FiTrash2 } from "react-icons/fi";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const STATUS_LABELS = {
  SOUMISE: "Soumise",
  EN_COURS: "En cours",
  EN_ATTENTE_ETUDIANT: "Attente réponse",
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

function canEditReclamation(statut) {
  return statut === "SOUMISE" || statut === "EN_ATTENTE_ETUDIANT";
}

function canDeleteReclamation(statut) {
  return statut === "SOUMISE";
}

function StudentReclamationsBody() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [editing, setEditing] = useState(null);

  const reclamationsQuery = useQuery({
    queryKey: ["student", "reclamations"],
    queryFn: studentApi.listReclamations,
  });

  const createMutation = useMutation({
    mutationFn: studentApi.createReclamation,
    onSuccess: () => {
      setObjet("");
      setDescription("");
      pushSuccess("Réclamation envoyée avec succès.");
      queryClient.invalidateQueries({ queryKey: ["student", "reclamations"] });
    },
    onError: (error) => {
      pushError(getApiErrorMessage(error, "Impossible d'envoyer la réclamation."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => studentApi.updateReclamation(id, payload),
    onSuccess: () => {
      setEditing(null);
      pushSuccess("Réclamation mise à jour.");
      queryClient.invalidateQueries({ queryKey: ["student", "reclamations"] });
    },
    onError: (error) => {
      pushError(getApiErrorMessage(error, "Impossible de modifier la réclamation."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentApi.deleteReclamation,
    onSuccess: () => {
      pushSuccess("Réclamation supprimée.");
      queryClient.invalidateQueries({ queryKey: ["student", "reclamations"] });
    },
    onError: (error) => {
      pushError(getApiErrorMessage(error, "Impossible de supprimer la réclamation."));
    },
  });

  const sourceRows = useMemo(() => reclamationsQuery.data || [], [reclamationsQuery.data]);
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sourceRows;
    return sourceRows.filter((r) => `${r.objet} ${r.description} ${r.statut}`.toLowerCase().includes(needle));
  }, [sourceRows, search]);

  const isFilteredEmpty = sourceRows.length > 0 && rows.length === 0;

  function submitForm(e) {
    e.preventDefault();
    const cleanObjet = objet.trim();
    const cleanDescription = description.trim();
    if (!cleanObjet || !cleanDescription) return;
    createMutation.mutate({
      objet: cleanObjet,
      description: cleanDescription,
    });
  }

  function startEdit(row) {
    setEditing({ id: row.id, objet: row.objet, description: row.description, statut: row.statut });
  }

  function cancelEdit() {
    setEditing(null);
  }

  function submitEdit(e) {
    e.preventDefault();
    if (!editing) return;
    const cleanObjet = editing.objet.trim();
    const cleanDescription = editing.description.trim();
    if (!cleanObjet || !cleanDescription) return;
    updateMutation.mutate({
      id: editing.id,
      payload: { objet: cleanObjet, description: cleanDescription },
    });
  }

  function confirmDelete(row) {
    if (!canDeleteReclamation(row.statut)) return;
    const ok = window.confirm(
      "Supprimer cette réclamation ? Cette action est définitive et n'est possible que tant qu'elle n'a pas été prise en charge.",
    );
    if (ok) deleteMutation.mutate(row.id);
  }

  if (reclamationsQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Passer une réclamation</h1>
        <div className="text-muted">
          Déposez une demande, puis suivez son traitement. Tant qu'elle est « soumise », vous pouvez la modifier ou la
          supprimer.
        </div>
      </div>

      <div className="col-12 col-xl-5">
        <form className="sehily-surface p-3 d-grid gap-3" onSubmit={submitForm}>
          <div className="fw-bold">Nouvelle réclamation</div>
          <div>
            <label className="form-label small">Objet</label>
            <input
              className="form-control"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Ex: Erreur montant de bourse"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label className="form-label small">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              required
            />
          </div>
          <button className="btn sehily-btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Envoi..." : "Envoyer la réclamation"}
          </button>
        </form>
      </div>

      <div className="col-12 col-xl-7">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
            <div className="fw-bold">Mes réclamations</div>
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {reclamationsQuery.error ? (
            <div className="alert alert-danger py-2">
              {getApiErrorMessage(reclamationsQuery.error, "Impossible de charger les réclamations.")}
            </div>
          ) : null}
          {!rows.length ? (
            <div className="partner-payments-empty py-5 px-3 text-center">
              <div className="partner-payments-empty-icon mx-auto mb-3" aria-hidden="true">
                <FiInbox size={28} strokeWidth={1.25} />
              </div>
              <div className="fw-semibold mb-1">{isFilteredEmpty ? "Aucun résultat" : "Aucune réclamation pour le moment"}</div>
              <p className="small text-muted mb-0">
                {isFilteredEmpty
                  ? "Modifiez le filtre pour afficher vos réclamations."
                  : "Lorsque vous envoyez une demande, elle apparaîtra ici avec son statut."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm admin-table-pro admin-table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Objet</th>
                    <th>Statut</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.date_creation).toLocaleString()}</td>
                      <td>{row.objet}</td>
                      <td>
                        <StatusBadge status={row.statut} labelMap={STATUS_LABELS} classMap={STATUS_BADGE_CLASS} />
                      </td>
                      <td>{row.description}</td>
                      <td className="text-end text-nowrap">
                        {canEditReclamation(row.statut) ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary me-1"
                            title="Modifier"
                            aria-label="Modifier"
                            onClick={() => startEdit(row)}
                          >
                            <FiEdit2 size={14} />
                          </button>
                        ) : null}
                        {canDeleteReclamation(row.statut) ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Supprimer"
                            aria-label="Supprimer"
                            disabled={deleteMutation.isPending}
                            onClick={() => confirmDelete(row)}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        ) : null}
                        {!canEditReclamation(row.statut) && !canDeleteReclamation(row.statut) ? (
                          <span className="small text-muted">—</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={submitEdit}>
              <div className="modal-header">
                <h2 className="modal-title h5">Modifier la réclamation</h2>
                <button type="button" className="btn-close" aria-label="Fermer" onClick={cancelEdit} />
              </div>
              <div className="modal-body d-grid gap-3">
                <div>
                  <label className="form-label small">Objet</label>
                  <input
                    className="form-control"
                    value={editing.objet}
                    onChange={(e) => setEditing((prev) => ({ ...prev, objet: e.target.value }))}
                    maxLength={255}
                    required
                  />
                </div>
                <div>
                  <label className="form-label small">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={editing.description}
                    onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                {editing.statut === "EN_ATTENTE_ETUDIANT" ? (
                  <p className="small text-muted mb-0">
                    L'administration attend votre réponse : vous pouvez compléter ou corriger votre message.
                  </p>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                  Annuler
                </button>
                <button type="submit" className="btn sehily-btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Remount when URL search `q` changes so the filter field stays in sync with la recherche globale. */
export function StudentReclamationsPage() {
  const [searchParams] = useSearchParams();
  const urlQKey = searchParams.get("q") ?? "";
  return <StudentReclamationsBody key={urlQKey} />;
}
