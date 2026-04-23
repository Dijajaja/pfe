import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 8;

function ConfirmActionModal({ selected, status, comment, setStatus, setComment, onClose, onConfirm, isPending }) {
  if (!selected) return null;
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <h2 className="h5 mb-2">Confirmer la mise à jour</h2>
        <p className="text-muted mb-3">
          Dossier <strong>{selected.numero}</strong> ({selected.etudiant})
        </p>
        <div className="mb-2">
          <label className="form-label small">Nouveau statut</label>
          <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isPending}>
            <option value="EN_INSTRUCTION">En instruction</option>
            <option value="VALIDE">Valider</option>
            <option value="REJETE">Rejeter</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label small">Commentaire admin</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire..."
            disabled={isPending}
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-sm sehily-btn-secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </button>
          <button className="btn btn-sm sehily-btn-primary d-flex align-items-center gap-2" onClick={onConfirm} disabled={isPending}>
            {isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            <span>Confirmer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDossiersPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [comment, setComment] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("VALIDE");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const dossiersQuery = useQuery({
    queryKey: ["admin", "dossiers"],
    queryFn: adminApi.listDossiers,
  });

  useEffect(() => {
    const data = dossiersQuery.data || [];
    const normalized = data.map((d) => ({
      id: d.id,
      numero: `DOS-${String(d.id).padStart(6, "0")}`,
      etudiant: d.etudiant || d.etudiant_email || `Utilisateur #${d.etudiant}`,
      annee: d.annee_universitaire,
      statut: d.statut,
      workflowStatut: d.workflow_statut || d.statut,
      statutPaiement: d.statut_paiement || null,
      montant: Number(d.montant_bourse || 0),
      dateSoumission: d.date_soumission || d.cree_le || null,
    }));
    setRows(normalized);
  }, [dossiersQuery.data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateDossier(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "dossiers"] });
      await qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setComment("");
      setModalOpen(false);
      pushSuccess("Statut dossier mis à jour.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec mise à jour dossier.")),
  });
  const sendMutation = useMutation({
    mutationFn: ({ id }) => adminApi.sendDossierToMauripost(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "dossiers"] });
      await qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      await qc.invalidateQueries({ queryKey: ["admin", "paiements"] });
      pushSuccess("Dossier envoyé à Mauripost.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec envoi à Mauripost.")),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = rows.filter((r) => {
      const searchOk = `${r.numero} ${r.etudiant} ${r.workflowStatut}`.toLowerCase().includes(q);
      const statusOk = statusFilter === "ALL" ? true : r.workflowStatut === statusFilter;
      return searchOk && statusOk;
    });
    return [...base].sort((a, b) => {
      if (sortBy === "montant_desc") return b.montant - a.montant;
      if (sortBy === "montant_asc") return a.montant - b.montant;
      const aDate = new Date(a.dateSoumission || 0);
      const bDate = new Date(b.dateSoumission || 0);
      if (sortBy === "date_asc") return aDate - bDate;
      return bDate - aDate;
    });
  }, [rows, search, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selected = rows.find((r) => r.id === selectedId) || null;

  function confirmModalAction() {
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      payload: { statut: pendingStatus, commentaire_admin: comment },
    });
  }

  function openModal(status) {
    if (!selectedId) {
      pushInfo("Sélectionne un dossier avant de traiter.");
      return;
    }
    setPendingStatus(status);
    setModalOpen(true);
  }

  function sendToMauripost() {
    if (!selectedId || !selected) return;
    sendMutation.mutate({ id: selectedId });
  }

  if (dossiersQuery.isError) return <div className="alert alert-danger">{getApiErrorMessage(dossiersQuery.error, "Erreur chargement dossiers.")}</div>;
  if (dossiersQuery.isLoading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Dossiers</h1>
        <div className="text-muted">Liste, filtre, tri, détail, validation/rejet + commentaire.</div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="sehily-surface p-3">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control form-control-sm"
              placeholder="Rechercher (numéro, étudiant, statut)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="ALL">Statut: Tous</option>
              <option value="SOUMIS">Soumis</option>
              <option value="EN_INSTRUCTION">En instruction</option>
              <option value="VALIDE">Validé</option>
              <option value="ENVOYE">Envoyé</option>
              <option value="PAYE">Payé</option>
              <option value="REJETE">Rejeté</option>
            </select>
            <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Tri: Date récente</option>
              <option value="date_asc">Tri: Date ancienne</option>
              <option value="montant_desc">Tri: Montant décroissant</option>
              <option value="montant_asc">Tri: Montant croissant</option>
            </select>
          </div>
          {dossiersQuery.isFetching ? (
            <div className="d-flex align-items-center gap-2 small text-muted mb-2">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Actualisation en cours...
            </div>
          ) : null}
          <div className="table-responsive">
            <table className="table table-sm align-middle admin-table-hover">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Étudiant</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer", background: selectedId === r.id ? "var(--sehily-creme)" : "transparent" }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td>{r.numero}</td>
                    <td>{r.etudiant}</td>
                    <td>{r.montant.toLocaleString()} MRU</td>
                    <td><StatusBadge status={r.workflowStatut} /></td>
                  </tr>
                ))}
                {!pagedRows.length ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Aucun dossier disponible
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Page {currentPage}/{totalPages}</small>
            <div className="btn-group btn-group-sm">
              <button className="btn sehily-btn-secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Précédent
              </button>
              <button className="btn sehily-btn-secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-5">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Détail dossier</div>
          {selected ? (
            <>
              <div className="small text-muted">Numéro</div>
              <div className="fw-semibold mb-2">{selected.numero}</div>
              <div className="small text-muted">Étudiant</div>
              <div className="fw-semibold mb-2">{selected.etudiant}</div>
              <div className="small text-muted">Montant</div>
              <div className="fw-semibold mb-2">{selected.montant.toLocaleString()} MRU</div>
              <div className="small text-muted">Statut actuel</div>
              <div className="fw-semibold mb-2"><StatusBadge status={selected.workflowStatut} /></div>
              <div className="small text-muted mb-3">
                Statut dossier: <strong>{selected.statut}</strong>
                {selected.statutPaiement ? ` | Paiement: ${selected.statutPaiement}` : ""}
              </div>

              <textarea
                className="form-control mb-3"
                rows={3}
                placeholder="Commentaire admin"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="d-flex gap-2">
                <button className="btn sehily-btn-primary" onClick={() => openModal("VALIDE")} disabled={updateMutation.isPending}>
                  Valider
                </button>
                <button className="btn sehily-btn-accent" onClick={() => openModal("REJETE")} disabled={updateMutation.isPending}>
                  Rejeter
                </button>
                <button className="btn sehily-btn-secondary" onClick={() => openModal("EN_INSTRUCTION")} disabled={updateMutation.isPending}>
                  Instruire
                </button>
                {selected.statut === "VALIDE" && selected.workflowStatut === "VALIDE" ? (
                  <button className="btn sehily-btn-primary d-flex align-items-center" onClick={sendToMauripost} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                    <span className="ms-1">Envoyer à Mauripost</span>
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-muted small">Sélectionne un dossier dans la liste.</div>
          )}
        </div>
      </div>
      <ConfirmActionModal
        selected={modalOpen ? selected : null}
        status={pendingStatus}
        comment={comment}
        setStatus={setPendingStatus}
        setComment={setComment}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmModalAction}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}

