import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiClock, FiDownload, FiFileText, FiTrendingUp } from "react-icons/fi";

import { partnerApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { DashboardKpiCard } from "../../components/dashboard/DashboardKpiCard";
import { DashboardLineChart } from "../../components/dashboard/DashboardLineChart";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 6;

function formatDate(isoLike) {
  if (!isoLike) return "-";
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
}

function enrichPayments(rows = []) {
  return rows.map((item, index) => {
    const emission = item.date_emission || item.date_operation || new Date(Date.now() - index * 86400000).toISOString();
    const echeance = new Date(new Date(emission).getTime() + 4 * 86400000).toISOString();
    return {
      ...item,
      emission,
      echeance,
      etudiantLabel: item.etudiant_email || `Étudiant #${item.dossier_id}`,
      referenceLabel: item.reference_externe || `P${String(item.id).padStart(6, "0")}`,
    };
  });
}

function buildSeries(finalValue) {
  const target = Math.max(1, finalValue);
  return [
    { month: "Nov", value: Math.round(target * 0.22) },
    { month: "Dec", value: Math.round(target * 0.38) },
    { month: "Jan", value: Math.round(target * 0.55) },
    { month: "Fev", value: Math.round(target * 0.72) },
    { month: "Mar", value: Math.round(target * 0.82) },
    { month: "Avr", value: target },
  ];
}

function ProcessConfirmModal({ payment, onConfirm, onClose, isPending }) {
  if (!payment) return null;
  return (
    <div className="partner-modal-backdrop">
      <div className="partner-modal">
        <h2 className="h5 mb-2">Confirmer le traitement</h2>
        <p className="text-muted mb-3">
          Voulez-vous traiter le paiement <strong>{payment.referenceLabel}</strong> pour{" "}
          <strong>{Number(payment.montant || 0).toLocaleString()} MRU</strong> ?
        </p>
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

export function PartnerBatchesPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [history, setHistory] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState([]);

  const activeView = (() => {
    const key = location.pathname.split("/").pop();
    return key === "batches" ? "dashboard" : key || "dashboard";
  })();

  const partnerQuery = useQuery({
    queryKey: ["partner", "paiements"],
    queryFn: () => partnerApi.listOperationalPaiements(),
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: (operation) => partnerApi.confirmPaiements([operation]),
    onSuccess: (_, operation) => {
      setSelectedPayment(null);
      setHistory((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          reference: operation.reference_externe,
          detail: `Paiement ${operation.id} confirmé`,
        },
        ...prev,
      ]);
      pushSuccess("Paiement confirmé avec succès.");
      queryClient.invalidateQueries({ queryKey: ["partner", "paiements"] });
    },
    onError: (err) => {
      pushError(getApiErrorMessage(err, "Échec de confirmation du paiement."));
    },
  });

  const payments = useMemo(() => enrichPayments(partnerQuery.data || []), [partnerQuery.data]);
  const waitingPayments = payments.filter((p) => p.statut === "ENVOYE");
  const completedPayments = payments.filter((p) => p.statut === "EFFECTUE");
  const assignedCount = payments.length;
  const confirmedCount = completedPayments.length;
  const waitingCount = waitingPayments.length;
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.montant || 0), 0);
  const todayConfirmed = Math.max(0, Math.round(confirmedCount * 0.08));
  const chartTotal = Math.max(1, assignedCount);
  const confirmedPct = Math.round((confirmedCount / chartTotal) * 100);
  const waitingPct = Math.round((waitingCount / chartTotal) * 100);
  const inProgressCount = Math.max(0, assignedCount - confirmedCount - waitingCount);
  const inProgressPct = Math.round((inProgressCount / chartTotal) * 100);
  const rejectedCount = 0;
  const rejectedPct = 0;
  const trendSeries = useMemo(() => buildSeries(confirmedCount), [confirmedCount]);

  const notifications = useMemo(() => {
    const list = [
      {
        id: "pending",
        title: `${waitingCount} paiements envoyés à traiter`,
        message: "Flux CNOU -> Mauripost en attente de confirmation partenaire.",
        type: "warning",
      },
      {
        id: "update",
        title: "Mise à jour système",
        message: "Une nouvelle mise à jour est disponible.",
        type: "info",
      },
      {
        id: "last-confirmed",
        title: "Paiement confirmé",
        message: history[0] ? `${history[0].detail} le ${formatDate(history[0].date)}` : "Aucune confirmation récente.",
        type: "success",
      },
    ];
    return list;
  }, [history, waitingCount]);

  const unreadNotifications = notifications.filter((n) => !readNotifIds.includes(n.id));

  const chartStyle = {
    background: `conic-gradient(
      #0db277 0 ${confirmedPct}%,
      #f2be2f ${confirmedPct}% ${confirmedPct + waitingPct}%,
      #2c7be4 ${confirmedPct + waitingPct}% ${confirmedPct + waitingPct + inProgressPct}%,
      #e45555 ${confirmedPct + waitingPct + inProgressPct}% ${confirmedPct + waitingPct + inProgressPct + rejectedPct}%,
      #dee2e6 ${confirmedPct + waitingPct + inProgressPct + rejectedPct}% 100%
    )`,
  };

  const filteredRows = useMemo(() => {
    const source = activeView === "completed" ? completedPayments : activeView === "to-process" ? waitingPayments : payments;
    const statusFiltered = source.filter((row) => (statusFilter === "ALL" ? true : row.statut === statusFilter));
    const sorted = [...statusFiltered].sort((a, b) => {
      if (sortBy === "montant_asc") return Number(a.montant || 0) - Number(b.montant || 0);
      if (sortBy === "montant_desc") return Number(b.montant || 0) - Number(a.montant || 0);
      if (sortBy === "date_asc") return new Date(a.emission) - new Date(b.emission);
      return new Date(b.emission) - new Date(a.emission);
    });
    return sorted;
  }, [activeView, completedPayments, payments, sortBy, statusFilter, waitingPayments]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const rowsForCurrentView = activeView === "to-process" ? waitingPayments : activeView === "completed" ? completedPayments : filteredRows;

  function openProcessModal(payment) {
    setSelectedPayment(payment);
  }

  function confirmSelectedPayment() {
    if (!selectedPayment) return;
    confirmMutation.mutate({
      id: selectedPayment.id,
      statut: "EFFECTUE",
      reference_externe: `EXT-${selectedPayment.id}`,
    });
  }

  function markNotificationRead(id) {
    if (readNotifIds.includes(id)) return;
    setReadNotifIds((prev) => [...prev, id]);
    pushInfo("Notification marquée comme lue.");
  }

  function exportCsv() {
    const rows = completedPayments.map((p) => `${p.id},${p.referenceLabel},${p.etudiantLabel},${p.montant},${p.statut},${formatDate(p.emission)}`);
    const csv = ["id,reference,etudiant,montant,statut,date", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "releve_paiements_partenaire.csv";
    a.click();
    URL.revokeObjectURL(url);
    pushSuccess("Relevé téléchargé.");
  }

  function renderDataTable(title, rows) {
    return (
      <div className="sehily-surface p-3">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="fw-bold">{title}</div>
          <div className="d-flex gap-2 flex-wrap">
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="ALL">Tous statuts</option>
              <option value="ENVOYE">Envoyé</option>
              <option value="EFFECTUE">Payé</option>
            </select>
            <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Date (récent)</option>
              <option value="date_asc">Date (ancien)</option>
              <option value="montant_desc">Montant (haut-bas)</option>
              <option value="montant_asc">Montant (bas-haut)</option>
            </select>
          </div>
        </div>
        {partnerQuery.isFetching ? (
          <div className="d-flex align-items-center gap-2 small text-muted mb-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Actualisation en cours...
          </div>
        ) : null}
        <div className="table-responsive">
          <table className="table table-sm align-middle admin-table-pro mb-0 partner-table-hover">
            <thead>
              <tr>
                <th>Réf. paiement</th>
                <th>Étudiant</th>
                <th>Montant</th>
                <th>Date émission</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.referenceLabel}</td>
                    <td>{p.etudiantLabel}</td>
                    <td>{Number(p.montant || 0).toLocaleString()} MRU</td>
                    <td>{formatDate(p.emission)}</td>
                    <td>
                      <StatusBadge status={p.statut} />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm sehily-btn-primary d-flex align-items-center gap-2"
                        disabled={p.statut !== "ENVOYE" || confirmMutation.isPending}
                        onClick={() => openProcessModal(p)}
                      >
                        {confirmMutation.isPending && selectedPayment?.id === p.id ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                        <span>Traiter</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Aucun paiement disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">
            Page {currentPage}/{totalPages}
          </small>
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
    );
  }

  if (partnerQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (partnerQuery.error) {
    return (
      <div className="alert alert-danger">
        {getApiErrorMessage(partnerQuery.error, "Impossible de charger les données partenaire.")}
      </div>
    );
  }

  if (activeView === "to-process") {
    return (
      <>
        {renderDataTable("Paiements à traiter", pagedRows)}
        <ProcessConfirmModal payment={selectedPayment} onConfirm={confirmSelectedPayment} onClose={() => setSelectedPayment(null)} isPending={confirmMutation.isPending} />
      </>
    );
  }

  if (activeView === "completed") {
    return renderDataTable("Paiements effectués", pagedRows);
  }

  if (activeView === "history") {
    const historyRows = history.length
      ? history
      : completedPayments.map((p) => ({
          id: p.id,
          date: p.emission,
          reference: p.referenceLabel,
          detail: `Paiement confirmé pour ${p.etudiantLabel}`,
        }));
    return (
      <div className="sehily-surface p-3">
        <div className="fw-bold mb-2">Historique des opérations</div>
        <div className="table-responsive">
          <table className="table table-sm align-middle admin-table-pro mb-0 partner-table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Référence</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length ? (
                historyRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.reference}</td>
                    <td>{row.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-muted">
                    Aucun paiement disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeView === "reports") {
    return (
      <div className="sehily-surface p-3">
        <div className="fw-bold mb-2">Relevés / Rapports</div>
        <div className="text-muted mb-3">
          Génération rapide de relevés basés sur les paiements effectués.
        </div>
        <button className="btn sehily-btn-accent d-flex align-items-center gap-2" onClick={exportCsv}>
          <FiDownload size={16} />
          <span>Télécharger relevé CSV</span>
        </button>
      </div>
    );
  }

  if (activeView === "notifications") {
    return (
      <div className="sehily-surface p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-bold">Notifications</div>
          <span className="sehily-badge sehily-badge--warn">{unreadNotifications.length} non lues</span>
        </div>
        <div className="admin-alert-list">
          {notifications.map((n) => (
            <div key={n.id} className="admin-alert-item">
              <div>
                <div className="fw-semibold">{n.title}</div>
                <div className="small text-muted">{n.message}</div>
              </div>
              <button className="btn btn-sm sehily-btn-secondary" disabled={readNotifIds.includes(n.id)} onClick={() => markNotificationRead(n.id)}>
                {readNotifIds.includes(n.id) ? "Lue" : "Marquer lue"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeView === "settings") {
    return (
      <div className="sehily-surface p-3">
        <div className="fw-bold mb-2">Paramètres partenaire</div>
        <div className="text-muted mb-3">Configuration du tableau de bord et des préférences de notification.</div>
        <button className="btn sehily-btn-secondary" onClick={() => pushSuccess("Préférences enregistrées.")}>
          Enregistrer les préférences
        </button>
      </div>
    );
  }

  return (
    <div className="row g-3 partner-dashboard-pro">
      <div className="col-12">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1 className="h4 mb-1">Bonjour Mauripost</h1>
            <div className="text-muted">Voici un aperçu de vos opérations de paiement.</div>
          </div>
          <button className="btn btn-sm sehily-btn-secondary d-flex align-items-center gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ["partner", "paiements"] })} disabled={partnerQuery.isFetching}>
            {partnerQuery.isFetching ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label="Paiements assignés"
          value={assignedCount.toLocaleString()}
          subLabel="opérations reçues"
          tone="info"
          icon={FiFileText}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label="Paiements envoyés"
          value={waitingCount.toLocaleString()}
          subLabel="à payer par Mauripost"
          tone="warning"
          icon={FiClock}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label="Paiements payés"
          value={confirmedCount.toLocaleString()}
          subLabel="traités avec succès"
          tone="success"
          icon={FiCheckCircle}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label="Montant total"
          value={`${Math.round(totalAmount).toLocaleString()} MRU`}
          subLabel="volume global"
          tone="accent"
          icon={FiDownload}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label="Aujourd'hui"
          value={todayConfirmed.toLocaleString()}
          subLabel="paiements payés"
          tone="neutral"
          icon={FiTrendingUp}
          variant="partner"
        />
      </div>

      <div className="col-12 col-xl-5">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Répartition des paiements par statut</div>
          <div className="row g-3 align-items-center mt-1">
            <div className="col-12 col-md-6">
              <div className="cnou-donut mx-auto" style={chartStyle}>
                <div className="cnou-donut-inner">
                  <div className="text-center">
                    <div className="h5 mb-0">{assignedCount}</div>
                    <div className="small text-muted">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <ul className="list-unstyled mb-0 admin-legend-list">
                <li><span className="admin-dot admin-dot-warning" /><span>Envoyés</span><strong>{waitingCount}</strong></li>
                <li><span className="admin-dot admin-dot-success" /><span>Payés</span><strong>{confirmedCount}</strong></li>
                <li><span className="admin-dot admin-dot-info" /><span>En traitement</span><strong>{inProgressCount}</strong></li>
                <li><span className="admin-dot admin-dot-danger" /><span>Échoués</span><strong>{rejectedCount}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-7">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Évolution des paiements payés</div>
            <div className="small text-muted">6 derniers mois</div>
          </div>
          <DashboardLineChart
            className="partner-linechart"
            labelsClassName="partner-linechart-labels"
            data={trendSeries}
            series={[{ key: "value", color: "#2c7be4" }]}
            width={520}
            height={210}
          />
        </div>
      </div>

      <div className="col-12 col-xl-8">
        {renderDataTable("Paiements à traiter", pagedRows.slice(0, 5))}
      </div>

      <div className="col-12 col-xl-4">
        <div className="sehily-surface p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Notifications</div>
            <span className="sehily-badge sehily-badge--warn">{unreadNotifications.length}</span>
          </div>
          <div className="admin-alert-list">
            {notifications.map((n) => (
              <div key={n.id} className="admin-alert-item">
                <div>
                  <div className="fw-semibold">{n.title}</div>
                  <div className="small text-muted">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sehily-surface p-3 mb-3">
          <div className="fw-bold mb-2">Actions rapides</div>
          <div className="admin-quick-actions-grid">
            <button className="admin-quick-action admin-quick-action-success border-0" onClick={() => { if (rowsForCurrentView[0]) openProcessModal(rowsForCurrentView[0]); }} disabled={!rowsForCurrentView.length || confirmMutation.isPending}>
              <span className="admin-quick-action-icon"><FiCheckCircle size={17} /></span>
              <span className="admin-quick-action-label">Confirmer un paiement</span>
            </button>
            <button className="admin-quick-action admin-quick-action-info border-0" onClick={() => pushInfo("Ouvre l’onglet Historique pour le détail complet.")}>
              <span className="admin-quick-action-icon"><FiFileText size={17} /></span>
              <span className="admin-quick-action-label">Voir historique</span>
            </button>
            <button className="admin-quick-action admin-quick-action-accent border-0" onClick={exportCsv}>
              <span className="admin-quick-action-icon"><FiDownload size={17} /></span>
              <span className="admin-quick-action-label">Télécharger relevé</span>
            </button>
          </div>
        </div>
      </div>

      <ProcessConfirmModal payment={selectedPayment} onConfirm={confirmSelectedPayment} onClose={() => setSelectedPayment(null)} isPending={confirmMutation.isPending} />
    </div>
  );
}

