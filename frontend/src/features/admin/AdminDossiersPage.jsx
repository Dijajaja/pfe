import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiX } from "react-icons/fi";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 10;

function apiFileUrl(pathOrUrl) {
  if (!pathOrUrl) return "#";
  const s = String(pathOrUrl);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
}

function formatDateFr(isoLike) {
  if (!isoLike) return "—";
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

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
          <button type="button" className="btn btn-sm sehily-btn-secondary" onClick={onClose} disabled={isPending}>
            Annuler
          </button>
          <button type="button" className="btn btn-sm sehily-btn-primary d-flex align-items-center gap-2" onClick={onConfirm} disabled={isPending}>
            {isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            <span>Confirmer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDossiersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [comment, setComment] = useState("");
  const [nombreMois, setNombreMois] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("VALIDE");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) setSearch(q);
  }, [searchParams]);

  const dossiersQuery = useQuery({
    queryKey: ["admin", "dossiers"],
    queryFn: adminApi.listDossiers,
  });

  const rows = useMemo(() => {
    const data = dossiersQuery.data || [];
    return data.map((d) => ({
      id: d.id,
      numero: `DOS-${String(d.id).padStart(6, "0")}`,
      etudiant: d.etudiant_email || d.etudiant || `Utilisateur #${d.etudiant}`,
      annee: d.annee_universitaire,
      statut: d.statut,
      workflowStatut: d.workflow_statut || d.statut,
      statutPaiement: d.statut_paiement || null,
      montant: Number(d.montant_bourse || 0),
      dateSoumission: d.date_soumission || d.cree_le || null,
      wilaya: (d.wilaya && String(d.wilaya).trim()) || "—",
      documents: Array.isArray(d.documents) ? d.documents : [],
    }));
  }, [dossiersQuery.data]);

  useEffect(() => {
    const raw = searchParams.get("dossier");
    if (!raw) return;
    const dossierParam = Number(raw);
    if (!dossierParam || !rows.some((r) => r.id === dossierParam)) return;
    setSelectedId(dossierParam);
  }, [rows, searchParams]);

  function closeDrawer() {
    setSelectedId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("dossier");
        return next;
      },
      { replace: true },
    );
  }

  function openRow(id) {
    if (id !== selectedId) setNombreMois(1);
    setSelectedId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("dossier", String(id));
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    if (!selectedId) return;
    function onKey(e) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (selectedId) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => ["SOUMIS", "EN_INSTRUCTION"].includes(r.workflowStatut)).length;
    const validated = rows.filter((r) => ["VALIDE", "ENVOYE", "PAYE"].includes(r.workflowStatut)).length;
    const rejected = rows.filter((r) => r.workflowStatut === "REJETE").length;
    return { total, pending, validated, rejected };
  }, [rows]);

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
    mutationFn: ({ id, payload }) => adminApi.sendDossierToMauripost(id, payload),
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
      const hay = `${r.numero} ${r.etudiant} ${r.workflowStatut} ${r.wilaya}`.toLowerCase();
      const searchOk = !q || hay.includes(q);
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
    sendMutation.mutate({ id: selectedId, payload: { nombre_mois: Number(nombreMois) } });
  }

  if (dossiersQuery.isError) return <div className="alert alert-danger">{getApiErrorMessage(dossiersQuery.error, "Erreur chargement dossiers.")}</div>;
  if (dossiersQuery.isLoading) return <LoadingSkeleton lines={8} />;

  const drawerOpen = Boolean(selectedId);

  return (
    <div className="admin-dossiers-page">
      <div className="mb-3">
        <h1 className="h4 mb-1">Admin — Dossiers</h1>
        <div className="text-muted">Liste, filtres et traitement des dossiers (détail à droite).</div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card">
            <div className="admin-dossiers-stat-label">Total</div>
            <div className="admin-dossiers-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--pending">
            <div className="admin-dossiers-stat-label">En attente</div>
            <div className="admin-dossiers-stat-value">{stats.pending}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--ok">
            <div className="admin-dossiers-stat-label">Validés</div>
            <div className="admin-dossiers-stat-value">{stats.validated}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--danger">
            <div className="admin-dossiers-stat-label">Rejetés</div>
            <div className="admin-dossiers-stat-value">{stats.rejected}</div>
          </div>
        </div>
      </div>

      <div className="sehily-surface p-3">
        <div className="admin-dossiers-filters mb-3">
          <input
            className="form-control form-control-sm admin-dossiers-filter-search"
            placeholder="Filtrer cette liste (n°, étudiant, wilaya, statut)…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Recherche dossiers"
          />
          <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Statut">
            <option value="ALL">Tous les statuts</option>
            <option value="SOUMIS">Soumis</option>
            <option value="EN_INSTRUCTION">En instruction</option>
            <option value="VALIDE">Validé</option>
            <option value="ENVOYE">Envoyé</option>
            <option value="PAYE">Payé</option>
            <option value="REJETE">Rejeté</option>
          </select>
          <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Tri">
            <option value="date_desc">Date (récent)</option>
            <option value="date_asc">Date (ancien)</option>
            <option value="montant_desc">Montant (↓)</option>
            <option value="montant_asc">Montant (↑)</option>
          </select>
        </div>

        {dossiersQuery.isFetching ? (
          <div className="d-flex align-items-center gap-2 small text-muted mb-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Actualisation…
          </div>
        ) : null}

        <div className="table-responsive admin-dossiers-table-wrap">
          <table className="table table-hover table-sm align-middle mb-0 admin-table-pro">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Étudiant</th>
                <th>Wilaya</th>
                <th>Date</th>
                <th className="text-end">Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr
                  key={r.id}
                  className={selectedId === r.id ? "admin-dossiers-row--active" : ""}
                  onClick={() => openRow(r.id)}
                >
                  <td className="fw-semibold text-nowrap">{r.numero}</td>
                  <td>{r.etudiant}</td>
                  <td className="text-muted">{r.wilaya}</td>
                  <td className="text-nowrap small">{formatDateFr(r.dateSoumission)}</td>
                  <td className="text-end text-nowrap">{r.montant.toLocaleString()} MRU</td>
                  <td>
                    <StatusBadge status={r.workflowStatut} />
                  </td>
                </tr>
              ))}
              {!pagedRows.length ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Aucun dossier ne correspond aux filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Page {currentPage}/{totalPages}</small>
          <div className="btn-group btn-group-sm">
            <button type="button" className="btn sehily-btn-secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </button>
            <button type="button" className="btn sehily-btn-secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Suivant
            </button>
          </div>
        </div>
      </div>

      <div
        className={`admin-dossiers-drawer-backdrop ${drawerOpen ? "is-open" : ""}`}
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
      />
      <aside className={`admin-dossiers-drawer ${drawerOpen ? "is-open" : ""}`} aria-hidden={!drawerOpen}>
        {selected ? (
          <>
            <div className="admin-dossiers-drawer-head">
              <div>
                <div className="small text-muted">Dossier</div>
                <div className="fw-bold">{selected.numero}</div>
              </div>
              <button type="button" className="btn btn-sm app-top-icon" aria-label="Fermer le panneau" onClick={closeDrawer}>
                <FiX size={18} />
              </button>
            </div>
            <div className="admin-dossiers-drawer-body">
              <div className="small text-muted">Étudiant</div>
              <div className="fw-semibold mb-2">{selected.etudiant}</div>
              <div className="small text-muted">Wilaya</div>
              <div className="mb-2">{selected.wilaya}</div>
              <div className="small text-muted">Montant</div>
              <div className="fw-semibold mb-2">{selected.montant.toLocaleString()} MRU</div>
              <div className="small text-muted">Statut</div>
              <div className="mb-2">
                <StatusBadge status={selected.workflowStatut} />
              </div>
              <div className="small text-muted mb-2">
                Dossier : <strong>{selected.statut}</strong>
                {selected.statutPaiement ? ` · Paiement : ${selected.statutPaiement}` : ""}
              </div>

              <div className="fw-semibold mb-2">Documents joints</div>
              {selected.documents.length ? (
                <ul className="list-unstyled admin-dossiers-doc-list mb-3">
                  {selected.documents.map((doc) => (
                    <li key={doc.id} className="admin-dossiers-doc-item">
                      <a href={apiFileUrl(doc.fichier)} target="_blank" rel="noopener noreferrer">
                        {doc.nom_fichier || doc.type_piece || `Document #${doc.id}`}
                      </a>
                      <div className="small text-muted">{doc.type_piece}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="small text-muted mb-3">Aucun document joint.</div>
              )}

              <div className="mb-3">
                <label className="form-label small">Durée paiement (mois)</label>
                <select className="form-select form-select-sm" value={nombreMois} onChange={(e) => setNombreMois(Number(e.target.value))}>
                  <option value={1}>1 mois</option>
                  <option value={2}>2 mois</option>
                  <option value={3}>3 mois</option>
                </select>
                <div className="small text-muted mt-1">
                  Montant estimé : <strong>{(selected.montant * Number(nombreMois)).toLocaleString()} MRU</strong>
                </div>
              </div>

              <label className="form-label small">Commentaire admin</label>
              <textarea className="form-control form-control-sm mb-3" rows={3} placeholder="Commentaire…" value={comment} onChange={(e) => setComment(e.target.value)} />

              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm sehily-btn-primary" onClick={() => openModal("VALIDE")} disabled={updateMutation.isPending}>
                  Valider
                </button>
                <button type="button" className="btn btn-sm sehily-btn-accent" onClick={() => openModal("REJETE")} disabled={updateMutation.isPending}>
                  Rejeter
                </button>
                <button type="button" className="btn btn-sm sehily-btn-secondary" onClick={() => openModal("EN_INSTRUCTION")} disabled={updateMutation.isPending}>
                  Instruire
                </button>
                {selected.statut === "VALIDE" && selected.workflowStatut === "VALIDE" ? (
                  <button type="button" className="btn btn-sm sehily-btn-primary d-flex align-items-center" onClick={sendToMauripost} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                    <span className="ms-1">Envoyer à Mauripost</span>
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </aside>

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
