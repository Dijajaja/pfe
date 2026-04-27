import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiDownload, FiSettings, FiUsers } from "react-icons/fi";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { DashboardKpiCard } from "../../components/dashboard/DashboardKpiCard";
import { DashboardLineChart } from "../../components/dashboard/DashboardLineChart";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 6;

function ActionModal({ dossier, status, comment, setStatus, setComment, onClose, onConfirm, isPending }) {
  if (!dossier) return null;
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <h2 className="h5 mb-2">Confirmer le traitement dossier</h2>
        <p className="text-muted mb-3">
          Dossier <strong>DOS-{String(dossier.id).padStart(6, "0")}</strong> - {dossier.etudiant_email || dossier.etudiant || `Étudiant #${dossier.etudiant}`}
        </p>
        <div className="mb-2">
          <label className="form-label small">Nouveau statut</label>
          <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isPending}>
            <option value="EN_INSTRUCTION">En instruction</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Rejeté</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label small">Commentaire admin</label>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            placeholder="Commentaire optionnel..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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

function buildLineSeries(valides, soumis, rejetes) {
  const startValides = Math.max(10, Math.round(valides * 0.35));
  const startSoumis = Math.max(8, Math.round(soumis * 0.4));
  const startRejetes = Math.max(4, Math.round(rejetes * 0.3));
  return [
    { month: "Nov", valides: startValides, soumis: startSoumis, rejetes: startRejetes },
    { month: "Dec", valides: Math.round(valides * 0.52), soumis: Math.round(soumis * 0.58), rejetes: Math.round(rejetes * 0.48) },
    { month: "Jan", valides: Math.round(valides * 0.66), soumis: Math.round(soumis * 0.7), rejetes: Math.round(rejetes * 0.63) },
    { month: "Fev", valides: Math.round(valides * 0.8), soumis: Math.round(soumis * 0.82), rejetes: Math.round(rejetes * 0.77) },
    { month: "Mar", valides: Math.round(valides * 0.9), soumis: Math.round(soumis * 0.92), rejetes: Math.round(rejetes * 0.87) },
    { month: "Avr", valides, soumis, rejetes },
  ];
}

function QuickActionCard({ to, label, icon: Icon, tone = "primary", badge }) {
  return (
    <Link to={to} className={`admin-quick-action admin-quick-action-${tone}`}>
      {typeof badge === "number" ? <span className="admin-quick-action-badge">{badge}</span> : null}
      <span className="admin-quick-action-icon">
        <Icon size={17} />
      </span>
      <span className="admin-quick-action-label">{label}</span>
    </Link>
  );
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [nextStatus, setNextStatus] = useState("EN_INSTRUCTION");
  const [adminComment, setAdminComment] = useState("");
  const [actionHistory, setActionHistory] = useState([]);
  const [readAlertIds, setReadAlertIds] = useState([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users", "kpi"],
    queryFn: () => adminApi.listUsers(),
  });
  const dossiersQuery = useQuery({
    queryKey: ["admin", "dossiers", "recent"],
    queryFn: () => adminApi.listDossiers(),
  });
  const updateDossierMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateDossier(id, payload),
    onSuccess: (_, vars) => {
      pushSuccess("Dossier mis à jour avec succès.");
      setActionHistory((prev) => [
        {
          id: Date.now(),
          detail: `Dossier ${vars.id} -> ${vars.payload.statut}`,
          date: new Date().toLocaleString("fr-FR"),
        },
        ...prev,
      ]);
      setSelectedDossier(null);
      setAdminComment("");
      queryClient.invalidateQueries({ queryKey: ["admin", "dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (err) => {
      pushError(getApiErrorMessage(err, "Échec de mise à jour du dossier."));
    },
  });

  if (isLoading) return <LoadingSkeleton lines={8} />;
  if (error) return <div className="alert alert-danger">{getApiErrorMessage(error, "Impossible de charger le dashboard admin.")}</div>;

  const dossiers = data?.dossiers || {};
  const paiements = data?.paiements || {};
  const allDossiers = dossiersQuery.data || [];
  const total = Math.max(1, dossiers.total || 0);
  const soumisPct = Math.round(((dossiers.SOUMIS || 0) / total) * 100);
  const validesPct = Math.round(((dossiers.VALIDE || 0) / total) * 100);
  const rejetesPct = Math.round(((dossiers.REJETE || 0) / total) * 100);
  const enTraitementPct = Math.max(0, 100 - validesPct - soumisPct - rejetesPct);
  const lineSeries = buildLineSeries(dossiers.VALIDE || 0, dossiers.SOUMIS || 0, dossiers.REJETE || 0);
  const acceptanceRate = Math.round(((dossiers.VALIDE || 0) / total) * 1000) / 10;
  const pendingAlerts = Math.max(0, dossiers.SOUMIS || 0);
  const unconfirmedPayments = Math.max(0, (paiements.total || 0) - (paiements.EFFECTUE || 0));
  const expiredDocuments = Math.max(0, Math.round((dossiers.REJETE || 0) * 0.28));
  const activeUsersCount = Array.isArray(usersQuery.data)
    ? usersQuery.data.filter((u) => u?.is_active ?? u?.actif).length
    : 0;
  const exportableRowsCount = Math.max(0, paiements.total || 0);
  const alerts = [
    { id: "pending-dossiers", title: "Dossiers en attente", detail: `${pendingAlerts} dossiers à traiter`, count: pendingAlerts },
    { id: "pending-paiements", title: "Paiements non confirmés", detail: `${unconfirmedPayments} paiements en attente partenaire`, count: unconfirmedPayments },
    { id: "expired-docs", title: "Documents expirés", detail: `${expiredDocuments} documents à vérifier`, count: expiredDocuments },
    { id: "active-users", title: "Utilisateurs actifs", detail: `${activeUsersCount} comptes actifs`, count: activeUsersCount },
  ];
  const unreadAlerts = alerts.filter((a) => !readAlertIds.includes(a.id));

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = allDossiers
    .filter((row) => {
      const statusOk = statusFilter === "ALL" ? true : row.statut === statusFilter;
      if (!statusOk) return false;
      if (!normalizedSearch) return true;
      const reference = `dos-${String(row.id).padStart(6, "0")}`.toLowerCase();
      const student = String(row.etudiant_email || row.etudiant || "").toLowerCase();
      return reference.includes(normalizedSearch) || student.includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (sortBy === "montant_desc") return Number(b.montant_bourse || 0) - Number(a.montant_bourse || 0);
      if (sortBy === "montant_asc") return Number(a.montant_bourse || 0) - Number(b.montant_bourse || 0);
      const aDate = new Date(a.date_soumission || a.cree_le || 0);
      const bDate = new Date(b.date_soumission || b.cree_le || 0);
      if (sortBy === "date_asc") return aDate - bDate;
      return bDate - aDate;
    });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chartStyle = {
    background: `conic-gradient(
      #198754 0 ${validesPct}%,
      #ffc107 ${validesPct}% ${validesPct + soumisPct}%,
      #dc3545 ${validesPct + soumisPct}% ${validesPct + soumisPct + rejetesPct}%,
      #4a86e8 ${validesPct + soumisPct + rejetesPct}% ${validesPct + soumisPct + rejetesPct + enTraitementPct}%,
      #dee2e6 ${validesPct + soumisPct + rejetesPct}% 100%
    )`,
  };

  function openActionModal(dossier) {
    setSelectedDossier(dossier);
    setNextStatus(dossier.statut === "SOUMIS" ? "EN_INSTRUCTION" : "VALIDE");
    setAdminComment("");
  }

  function confirmAction() {
    if (!selectedDossier) return;
    updateDossierMutation.mutate({
      id: selectedDossier.id,
      payload: { statut: nextStatus, commentaire_admin: adminComment },
    });
  }

  function markAlertRead(alertId) {
    if (readAlertIds.includes(alertId)) return;
    setReadAlertIds((prev) => [...prev, alertId]);
    pushInfo("Alerte marquée comme lue.");
  }

  return (
    <div className="row g-3 admin-dashboard-pro">
      <div className="col-12">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1 className="h4 mb-1">Dashboard Admin CNOU</h1>
            <div className="text-muted">Vue d’ensemble de la gestion des bourses</div>
          </div>
          <button className="btn btn-sm sehily-btn-secondary">01/04/2024 - 30/04/2024</button>
        </div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard label="Total dossiers" value={dossiers.total || 0} tone="petrole" trend={12.5} variant="admin" />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard label="Dossiers soumis" value={dossiers.SOUMIS || 0} tone="warning" trend={8.2} variant="admin" />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard label="Dossiers validés" value={dossiers.VALIDE || 0} tone="success" trend={15.7} variant="admin" />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard label="Dossiers rejetés" value={dossiers.REJETE || 0} tone="danger" trend={-5.3} variant="admin" />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard label="Paiements effectués" value={paiements.EFFECTUE || 0} tone="info" trend={18.3} variant="admin" />
      </div>

      <div className="col-12 col-xl-8">
        <div className="row g-3">
          <div className="col-12 col-xxl-5">
            <div className="sehily-surface p-3">
              <div className="fw-bold mb-2">Répartition des dossiers par statut</div>
              <div className="row g-3 align-items-center mt-1">
                <div className="col-12 col-md-6">
                  <div className="cnou-donut mx-auto" style={chartStyle}>
                    <div className="cnou-donut-inner">
                      <div className="text-center">
                        <div className="h5 mb-0">{dossiers.total || 0}</div>
                        <div className="small text-muted">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <ul className="list-unstyled mb-0 admin-legend-list">
                    <li>
                      <span className="admin-dot admin-dot-success" />
                      <span>Validés</span>
                      <strong>{dossiers.VALIDE || 0}</strong>
                    </li>
                    <li>
                      <span className="admin-dot admin-dot-warning" />
                      <span>Soumis</span>
                      <strong>{dossiers.SOUMIS || 0}</strong>
                    </li>
                    <li>
                      <span className="admin-dot admin-dot-danger" />
                      <span>Rejetés</span>
                      <strong>{dossiers.REJETE || 0}</strong>
                    </li>
                    <li>
                      <span className="admin-dot admin-dot-info" />
                      <span>En traitement</span>
                      <strong>{Math.max(0, dossiers.total - (dossiers.VALIDE || 0) - (dossiers.SOUMIS || 0) - (dossiers.REJETE || 0))}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xxl-7">
            <div className="sehily-surface p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-bold">Évolution des dossiers</div>
                <div className="small text-muted d-flex gap-3">
                  <span>
                    <span className="admin-dot admin-dot-success me-1" />
                    Validés
                  </span>
                  <span>
                    <span className="admin-dot admin-dot-warning me-1" />
                    Soumis
                  </span>
                  <span>
                    <span className="admin-dot admin-dot-danger me-1" />
                    Rejetés
                  </span>
                </div>
              </div>
              <DashboardLineChart
                className="admin-linechart"
                labelsClassName="admin-linechart-labels"
                data={lineSeries}
                series={[
                  { key: "valides", color: "#0db277" },
                  { key: "soumis", color: "#f2be2f" },
                  { key: "rejetes", color: "#e45555" },
                ]}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="sehily-surface p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">Derniers dossiers soumis</div>
                <div className="d-flex gap-2 flex-wrap">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Rechercher (email, référence)..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  />
                  <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="ALL">Tous statuts</option>
                    <option value="SOUMIS">Soumis</option>
                    <option value="EN_INSTRUCTION">En instruction</option>
                    <option value="VALIDE">Validé</option>
                    <option value="REJETE">Rejeté</option>
                  </select>
                  <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date_desc">Date (récent)</option>
                    <option value="date_asc">Date (ancien)</option>
                    <option value="montant_desc">Montant (haut-bas)</option>
                    <option value="montant_asc">Montant (bas-haut)</option>
                  </select>
                  <Link className="btn btn-sm sehily-btn-secondary" to="/app/admin/dossiers">
                    Voir tous les dossiers
                  </Link>
                </div>
              </div>
              {dossiersQuery.isFetching ? (
                <div className="d-flex align-items-center gap-2 small text-muted mb-2">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Actualisation en cours...
                </div>
              ) : null}
              {dossiersQuery.error ? (
                <div className="alert alert-danger py-2">{getApiErrorMessage(dossiersQuery.error, "Impossible de charger les dossiers.")}</div>
              ) : null}
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0 admin-table-pro admin-table-hover">
                  <thead>
                    <tr>
                      <th>Étudiant</th>
                      <th>Référence</th>
                      <th>Date soumission</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="admin-avatar">{(d.etudiant_email || d.etudiant || "E").toString().slice(0, 1).toUpperCase()}</span>
                            <span>{d.etudiant_email || d.etudiant || `Étudiant #${d.etudiant}`}</span>
                          </div>
                        </td>
                        <td>DOS-{String(d.id).padStart(6, "0")}</td>
                        <td>{d.date_soumission || d.created_at?.slice(0, 10) || "-"}</td>
                        <td>{Number(d.montant_bourse || 0).toLocaleString()} MRU</td>
                        <td>
                          <StatusBadge status={d.workflow_statut || d.statut} />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm sehily-btn-primary d-flex align-items-center gap-2"
                            onClick={() => openActionModal(d)}
                            disabled={updateDossierMutation.isPending}
                          >
                            {updateDossierMutation.isPending && selectedDossier?.id === d.id ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                            <span>Traiter</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!pagedRows.length ? (
                      <tr>
                        <td colSpan={6} className="text-muted text-center py-4">
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
        </div>
      </div>

      <div className="col-12">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="sehily-surface p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">Alertes</div>
                <span className="sehily-badge sehily-badge--warn">{unreadAlerts.length} non lues</span>
              </div>
              <div className="admin-alert-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`admin-alert-item ${readAlertIds.includes(alert.id) ? "" : "admin-alert-item--unread"}`}>
                    <div>
                      <div className="fw-semibold">{alert.title}</div>
                      <div className="small text-muted">{alert.detail}</div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="admin-alert-badge">{alert.count}</span>
                      <button className="btn btn-sm sehily-btn-secondary" disabled={readAlertIds.includes(alert.id)} onClick={() => markAlertRead(alert.id)}>
                        {readAlertIds.includes(alert.id) ? "Lue" : "Lire"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="sehily-surface p-3 h-100">
              <div className="fw-bold mb-2">Actions rapides</div>
              <div className="admin-quick-actions-grid">
                <QuickActionCard
                  to="/app/admin/dossiers"
                  label="Valider dossiers"
                  icon={FiCheckCircle}
                  tone="success"
                  badge={pendingAlerts}
                />
                <QuickActionCard
                  to="/app/admin/exports"
                  label="Générer paiements"
                  icon={FiDownload}
                  tone="info"
                  badge={unconfirmedPayments}
                />
                <QuickActionCard
                  to="/app/admin/exports"
                  label="Exporter rapports"
                  icon={FiSettings}
                  tone="accent"
                  badge={exportableRowsCount}
                />
                <QuickActionCard
                  to="/app/admin/users"
                  label="Gérer utilisateurs"
                  icon={FiUsers}
                  tone="primary"
                  badge={activeUsersCount}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="sehily-surface p-3 h-100">
              <div className="fw-bold mb-2">Historique session</div>
              {!actionHistory.length ? (
                <div className="small text-muted">Aucune action admin enregistrée pour cette session.</div>
              ) : (
                <div className="small d-grid gap-1">
                  {actionHistory.slice(0, 4).map((h) => (
                    <div key={h.id} className="text-muted">{h.date} - {h.detail}</div>
                  ))}
                </div>
              )}
              <hr />
              <div className="fw-bold mb-2">Statistiques clés</div>
              <div className="small mb-1 d-flex justify-content-between">
                <span>Taux d’acceptation</span>
                <span className="fw-semibold">{acceptanceRate}%</span>
              </div>
              <div className="progress mb-2" style={{ height: 8 }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${acceptanceRate}%` }} />
              </div>
              <div className="small text-muted">Basé sur la proportion de dossiers validés.</div>
            </div>
          </div>
        </div>
      </div>
      <ActionModal
        dossier={selectedDossier}
        status={nextStatus}
        comment={adminComment}
        setStatus={setNextStatus}
        setComment={setAdminComment}
        onClose={() => setSelectedDossier(null)}
        onConfirm={confirmAction}
        isPending={updateDossierMutation.isPending}
      />
    </div>
  );
}

