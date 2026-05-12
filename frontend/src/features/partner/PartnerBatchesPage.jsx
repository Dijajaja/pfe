import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiClock, FiDownload, FiFileText, FiInbox, FiTrendingUp } from "react-icons/fi";

import { partnerApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  appendReadPartnerNotificationId,
  getReadPartnerNotificationIds,
  markAllPartnerNotificationsRead,
} from "../../lib/partnerNotificationRead";
import { buildPartnerNotificationsFeed, enrichPartnerPaymentRows } from "../../lib/partnerNotificationsFeed";
import { getPartnerReportsMeta, setPartnerReportsMeta } from "../../lib/partnerReportsStorage";
import { loadPartnerSettings, savePartnerSettings } from "../../lib/partnerSettingsStorage";
import { setLanguage } from "../../i18n/setup";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { DashboardKpiCard } from "../../components/dashboard/DashboardKpiCard";
import { DashboardLineChart } from "../../components/dashboard/DashboardLineChart";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 6;

const FR_SHORT_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatDate(isoLike) {
  if (!isoLike) return "-";
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
}

function formatPartnerSettingsSavedAt(iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const loc = String(lang || "").startsWith("ar") ? "ar" : "fr-FR";
  return d.toLocaleString(loc, { dateStyle: "short", timeStyle: "short" });
}

const HISTORY_TYPE_META = {
  CONFIRMATION: { label: "Confirmation", className: "partner-hist-badge partner-hist-badge--confirm" },
  PAIEMENT: { label: "Paiement", className: "partner-hist-badge partner-hist-badge--payment" },
  EXPORT: { label: "Export", className: "partner-hist-badge partner-hist-badge--export" },
};

function HistoryTypeBadge({ type }) {
  const meta = HISTORY_TYPE_META[type] || { label: type || "—", className: "partner-hist-badge partner-hist-badge--payment" };
  return <span className={meta.className}>{meta.label}</span>;
}

function HistoryResultBadge({ result }) {
  const ok = result === "OK";
  return <span className={ok ? "sehily-badge sehily-badge--ok" : "sehily-badge sehily-badge--danger"}>{ok ? "Réussi" : "Échec"}</span>;
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
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const globalQ = (searchParams.get("q") || "").trim().toLowerCase();
  const queryClient = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [history, setHistory] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => getReadPartnerNotificationIds());
  const [reportsExportCount, setReportsExportCount] = useState(() => getPartnerReportsMeta().count);
  const [lastExportAt, setLastExportAt] = useState(() => getPartnerReportsMeta().last);
  const [partnerSettings, setPartnerSettings] = useState(() => loadPartnerSettings());
  const [partnerSettingsDirty, setPartnerSettingsDirty] = useState(false);

  const activeView = (() => {
    const key = location.pathname.split("/").pop();
    return key === "batches" ? "dashboard" : key || "dashboard";
  })();

  useEffect(() => {
    setPage(1);
  }, [activeView, globalQ]);

  useEffect(() => {
    if (activeView === "settings") {
      setPartnerSettings(loadPartnerSettings());
      setPartnerSettingsDirty(false);
    }
  }, [activeView]);

  useEffect(() => {
    const m = getPartnerReportsMeta();
    setReportsExportCount(m.count);
    setLastExportAt(m.last);
  }, []);

  const partnerQuery = useQuery({
    queryKey: ["partner", "paiements"],
    queryFn: () => partnerApi.listOperationalPaiements(),
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, statut, reference_externe }) => partnerApi.confirmPaiements([{ id, statut, reference_externe }]),
    onSuccess: (_, vars) => {
      setSelectedPayment(null);
      const ref = vars.reference_externe;
      const label = vars.etudiantLabel || "étudiant";
      setHistory((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          reference: ref,
          detail: `Paiement confirmé pour ${label}`,
          operationType: "CONFIRMATION",
          result: "OK",
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

  const payments = useMemo(() => enrichPartnerPaymentRows(partnerQuery.data || []), [partnerQuery.data]);
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

  const notifications = useMemo(
    () =>
      buildPartnerNotificationsFeed(payments, history, {
        dataUpdatedAt: partnerQuery.dataUpdatedAt,
        locale: i18n.language,
      }),
    [payments, history, partnerQuery.dataUpdatedAt, i18n.language],
  );

  const unreadNotifications = notifications.filter((n) => !readNotifIds.includes(n.id));

  const confirmedMruTotal = completedPayments.reduce((sum, p) => sum + Number(p.montant || 0), 0);
  const lastExportLabel =
    lastExportAt && !Number.isNaN(new Date(lastExportAt).getTime())
      ? (() => {
          const d = new Date(lastExportAt);
          return `${FR_SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
        })()
      : "—";

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
    const qFiltered = statusFiltered.filter((row) => {
      if (!globalQ) return true;
      const hay = `${row.referenceLabel} ${row.etudiantLabel} ${row.statut} ${Number(row.montant || 0)} ${row.id}`.toLowerCase();
      return hay.includes(globalQ);
    });
    const sorted = [...qFiltered].sort((a, b) => {
      if (sortBy === "montant_asc") return Number(a.montant || 0) - Number(b.montant || 0);
      if (sortBy === "montant_desc") return Number(b.montant || 0) - Number(a.montant || 0);
      if (sortBy === "date_asc") return new Date(a.emission) - new Date(b.emission);
      return new Date(b.emission) - new Date(a.emission);
    });
    return sorted;
  }, [activeView, completedPayments, globalQ, payments, sortBy, statusFilter, waitingPayments]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const completedListStats = useMemo(() => {
    const list = activeView === "completed" ? filteredRows : [];
    const sum = list.reduce((s, p) => s + Number(p.montant || 0), 0);
    let maxMs = 0;
    for (const p of list) {
      const ms = new Date(p.emission || 0).getTime();
      if (!Number.isNaN(ms) && ms > maxMs) maxMs = ms;
    }
    return {
      count: list.length,
      sum,
      lastFormatted: maxMs ? formatDate(new Date(maxMs).toISOString()) : "—",
    };
  }, [activeView, filteredRows]);

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
      etudiantLabel: selectedPayment.etudiantLabel,
    });
  }

  function markNotificationRead(id) {
    if (readNotifIds.includes(id)) return;
    appendReadPartnerNotificationId(id);
    setReadNotifIds(getReadPartnerNotificationIds());
    pushInfo("Notification marquée comme lue.");
  }

  function bumpExportMeta() {
    const last = new Date().toISOString();
    setReportsExportCount((c) => {
      const next = c + 1;
      setPartnerReportsMeta(next, last);
      return next;
    });
    setLastExportAt(last);
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
    bumpExportMeta();
    pushSuccess("Relevé téléchargé.");
  }

  function escCell(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exportExcel() {
    const rows = completedPayments
      .map(
        (p) =>
          `<tr><td>${escCell(p.id)}</td><td>${escCell(p.referenceLabel)}</td><td>${escCell(p.etudiantLabel)}</td><td>${escCell(p.montant)}</td><td>${escCell(p.statut)}</td><td>${escCell(formatDate(p.emission))}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr><th>id</th><th>reference</th><th>etudiant</th><th>montant</th><th>statut</th><th>date</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "releve_paiements_partenaire.xls";
    a.click();
    URL.revokeObjectURL(url);
    bumpExportMeta();
    pushSuccess("Fichier Excel généré.");
  }

  function markAllNotificationsReadHandler() {
    markAllPartnerNotificationsRead(notifications.map((n) => n.id));
    setReadNotifIds(getReadPartnerNotificationIds());
    pushInfo("Toutes les notifications sont marquées comme lues.");
  }

  function savePartnerSettingsHandler() {
    if (!partnerSettingsDirty) return;
    const next = savePartnerSettings(partnerSettings);
    setPartnerSettings(next);
    setPartnerSettingsDirty(false);
    setLanguage(next.defaultLang);
    pushSuccess(t("partnerSettingsSaveSuccess"));
  }

  function renderPaymentsTable({ title, rows, mode }) {
    const embedded = mode === "embedded";
    const isCompleted = mode === "completed";
    const isToProcess = mode === "to-process";
    const filteredTotal = embedded ? rows.length : filteredRows.length;
    const emptyTitle = isCompleted ? "Aucun paiement effectué" : "Aucun paiement à traiter";
    const emptyHint = isCompleted
      ? "Les paiements confirmés apparaîtront ici une fois enregistrés."
      : "Les paiements envoyés par CNOU s’afficheront ici dès qu’ils seront disponibles.";

    return (
      <div className="sehily-surface p-3">
        {!embedded && isToProcess ? (
          <div className="partner-payments-stats-row">
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{waitingCount}</div>
              <div className="partner-payments-kpi-label">À traiter</div>
            </div>
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{confirmedCount}</div>
              <div className="partner-payments-kpi-label">Traités</div>
            </div>
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{inProgressCount}</div>
              <div className="partner-payments-kpi-label">En attente</div>
            </div>
          </div>
        ) : null}

        {!embedded && isCompleted ? (
          <div className="partner-payments-stats-row">
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{completedListStats.count}</div>
              <div className="partner-payments-kpi-label">Nombre (filtre)</div>
            </div>
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{Math.round(completedListStats.sum).toLocaleString()} MRU</div>
              <div className="partner-payments-kpi-label">Montant total</div>
            </div>
            <div className="partner-payments-kpi">
              <div className="partner-payments-kpi-value">{completedListStats.lastFormatted}</div>
              <div className="partner-payments-kpi-label">Dernier paiement</div>
            </div>
          </div>
        ) : null}

        <div className="d-flex flex-column flex-lg-row flex-lg-nowrap align-items-stretch align-items-lg-center justify-content-between gap-2 mb-2 partner-payments-head">
          <div className="fw-bold flex-shrink-0">{title}</div>
          <div className="d-flex flex-wrap align-items-center gap-2 partner-payments-toolbar ms-lg-auto">
            <select
              className="form-select form-select-sm partner-payments-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tous statuts</option>
              <option value="ENVOYE">Envoyé</option>
              <option value="EFFECTUE">Payé</option>
            </select>
            <select className="form-select form-select-sm partner-payments-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Date (récent)</option>
              <option value="date_asc">Date (ancien)</option>
              <option value="montant_desc">Montant (haut-bas)</option>
              <option value="montant_asc">Montant (bas-haut)</option>
            </select>
            {!embedded ? (
              <span className="small text-muted text-nowrap">
                {filteredTotal} résultat{filteredTotal > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>

        {partnerQuery.isFetching ? (
          <div className="d-flex align-items-center gap-2 small text-muted mb-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Actualisation en cours...
          </div>
        ) : null}

        {!rows.length ? (
          <div className="partner-payments-empty py-5 px-3 text-center">
            <div className="partner-payments-empty-icon mx-auto mb-3" aria-hidden="true">
              <FiInbox size={28} strokeWidth={1.25} />
            </div>
            <div className="fw-semibold mb-1">{emptyTitle}</div>
            <p className="small text-muted mb-0">{emptyHint}</p>
          </div>
        ) : (
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
                {rows.map((p) => (
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
                        type="button"
                        className="btn btn-sm partner-pro-btn-traiter-outline d-inline-flex align-items-center gap-2"
                        disabled={p.statut !== "ENVOYE" || confirmMutation.isPending}
                        onClick={() => openProcessModal(p)}
                      >
                        {confirmMutation.isPending && selectedPayment?.id === p.id ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                        <span>Traiter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!embedded ? (
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
        ) : null}
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
        {renderPaymentsTable({ title: "Paiements à traiter", rows: pagedRows, mode: "to-process" })}
        <ProcessConfirmModal payment={selectedPayment} onConfirm={confirmSelectedPayment} onClose={() => setSelectedPayment(null)} isPending={confirmMutation.isPending} />
      </>
    );
  }

  if (activeView === "completed") {
    return renderPaymentsTable({ title: "Paiements effectués", rows: pagedRows, mode: "completed" });
  }

  if (activeView === "history") {
    const historyRows = history.length
      ? history
      : completedPayments.map((p) => ({
          id: p.id,
          date: p.emission,
          reference: p.referenceLabel,
          detail: `Paiement confirmé pour ${p.etudiantLabel}`,
          operationType: "PAIEMENT",
          result: "OK",
        }));
    return (
      <div className="sehily-surface p-3">
        <div className="fw-bold mb-3">Historique des opérations</div>
        {!historyRows.length ? (
          <div className="partner-payments-empty py-5 px-3 text-center">
            <div className="partner-payments-empty-icon mx-auto mb-3" aria-hidden="true">
              <FiInbox size={28} strokeWidth={1.25} />
            </div>
            <div className="fw-semibold mb-1">Aucune opération enregistrée</div>
            <p className="small text-muted mb-0">Les confirmations et paiements traités apparaîtront ici.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle admin-table-pro mb-0 partner-table-hover partner-hist-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Référence</th>
                  <th>Statut</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => {
                  const opType = row.operationType || "PAIEMENT";
                  const res = row.result || "OK";
                  return (
                    <tr key={row.id}>
                      <td className="text-nowrap">{formatDate(row.date)}</td>
                      <td>
                        <HistoryTypeBadge type={opType} />
                      </td>
                      <td>{row.reference}</td>
                      <td>
                        <HistoryResultBadge result={res} />
                      </td>
                      <td>{row.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (activeView === "reports") {
    return (
      <div className="partner-pro-page">
        <header className="partner-pro-head mb-4">
          <h1 className="partner-pro-title">Relevés / Rapports</h1>
          <p className="text-muted mb-0">Génération rapide de relevés basés sur les paiements effectués.</p>
        </header>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="partner-pro-stat-card">
              <div className="partner-pro-stat-value">{reportsExportCount.toLocaleString()}</div>
              <div className="partner-pro-stat-label">Relevés générés</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="partner-pro-stat-card">
              <div className="partner-pro-stat-value">{Math.round(confirmedMruTotal).toLocaleString()}</div>
              <div className="partner-pro-stat-label">MRU total</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="partner-pro-stat-card">
              <div className="partner-pro-stat-value">{lastExportLabel}</div>
              <div className="partner-pro-stat-label">Dernière génération</div>
            </div>
          </div>
        </div>

        <div className="partner-pro-panel sehily-surface p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="fw-bold partner-pro-panel-title">Relevé des paiements effectués</div>
              <div className="text-muted small mt-1">
                {confirmedCount} paiement{confirmedCount > 1 ? "s" : ""} confirmé{confirmedCount > 1 ? "s" : ""} —{" "}
                {Math.round(confirmedMruTotal).toLocaleString()} MRU
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 partner-pro-export-btns">
              <button type="button" className="btn partner-pro-btn-outline" onClick={exportCsv}>
                <FiDownload size={16} className="me-1" />
                Télécharger CSV
              </button>
              <button type="button" className="btn partner-pro-btn-solid" onClick={exportExcel}>
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === "notifications") {
    const unread = unreadNotifications.length;
    return (
      <div className="partner-pro-page">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <header>
            <h1 className="partner-pro-title">Notifications</h1>
            <p className="text-muted mb-0">Centre de notifications et alertes système.</p>
          </header>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="partner-pro-pill-unread">
              {unread === 0 ? "À jour" : `${unread} NON LUE${unread > 1 ? "S" : ""}`}
            </span>
            <button
              type="button"
              className="btn btn-link partner-pro-link-muted text-decoration-none p-0"
              disabled={unread === 0}
              onClick={markAllNotificationsReadHandler}
            >
              Tout marquer lu
            </button>
          </div>
        </div>

        <div className="d-grid gap-3">
          {notifications.map((n) => {
            const isRead = readNotifIds.includes(n.id);
            return (
              <div key={n.id} className={`partner-pro-notif-card ${isRead ? "" : "partner-pro-notif-card--unread"}`}>
                <div className="partner-pro-notif-accent" aria-hidden />
                <div className="partner-pro-notif-inner">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold partner-pro-notif-title">{n.title}</div>
                      <p className="small text-muted mb-0 mt-1">{n.message}</p>
                    </div>
                    <span className="small text-muted text-nowrap flex-shrink-0">{n.timeLabel}</span>
                  </div>
                  <div className="text-end mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-link partner-pro-link-muted text-decoration-none p-0"
                      disabled={isRead}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      {isRead ? "Lue" : "Marquer lu"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeView === "settings") {
    return (
      <div className="partner-pro-page">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <header>
            <h1 className="partner-pro-title">Paramètres partenaire</h1>
            <p className="text-muted mb-0">Configuration du tableau de bord et des préférences de notification.</p>
          </header>
          <div className="d-flex flex-column align-items-lg-end gap-2">
            <button
              type="button"
              className="btn partner-pro-btn-solid"
              onClick={savePartnerSettingsHandler}
              disabled={!partnerSettingsDirty}
            >
              {t("partnerSettingsSave")}
            </button>
            <p className="small text-muted mb-0 text-lg-end" style={{ maxWidth: "18rem" }}>
              {partnerSettings.updatedAt
                ? t("partnerSettingsLastSaved", { when: formatPartnerSettingsSavedAt(partnerSettings.updatedAt, i18n.language) })
                : t("partnerSettingsNeverSaved")}
            </p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="partner-pro-settings-card h-100">
              <div className="fw-semibold partner-pro-settings-title">Notifications paiements</div>
              <p className="small text-muted mb-3">Recevoir une alerte à chaque paiement entrant.</p>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="partner-pay-notif"
                  checked={partnerSettings.paymentNotif}
                  onChange={(e) => {
                    setPartnerSettings((s) => ({ ...s, paymentNotif: e.target.checked }));
                    setPartnerSettingsDirty(true);
                  }}
                />
                <label className="form-check-label small" htmlFor="partner-pay-notif">
                  {partnerSettings.paymentNotif ? "Activé" : "Désactivé"}
                </label>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="partner-pro-settings-card h-100">
              <div className="fw-semibold partner-pro-settings-title">Notifications email</div>
              <p className="small text-muted mb-3">Envoyer un email de confirmation pour chaque traitement.</p>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="partner-email-notif"
                  checked={partnerSettings.emailNotif}
                  onChange={(e) => {
                    setPartnerSettings((s) => ({ ...s, emailNotif: e.target.checked }));
                    setPartnerSettingsDirty(true);
                  }}
                />
                <label className="form-check-label small" htmlFor="partner-email-notif">
                  {partnerSettings.emailNotif ? "Activé" : "Désactivé"}
                </label>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="partner-pro-settings-card h-100">
              <div className="fw-semibold partner-pro-settings-title">Langue par défaut</div>
              <p className="small text-muted mb-3">Choisir la langue d&apos;affichage de l&apos;interface.</p>
              <select
                className="form-select form-select-sm partner-pro-select"
                value={partnerSettings.defaultLang}
                onChange={(e) => {
                  setPartnerSettings((s) => ({ ...s, defaultLang: e.target.value }));
                  setPartnerSettingsDirty(true);
                }}
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="partner-pro-settings-card h-100">
              <div className="fw-semibold partner-pro-settings-title">Accès API</div>
              <p className="small text-muted mb-3">Clé d&apos;accès pour l&apos;intégration avec CNOU.</p>
              <input
                type="password"
                className="form-control form-control-sm partner-pro-api-input"
                autoComplete="off"
                value={partnerSettings.apiKeyDisplay}
                onChange={(e) => {
                  setPartnerSettings((s) => ({ ...s, apiKeyDisplay: e.target.value }));
                  setPartnerSettingsDirty(true);
                }}
                placeholder="Clé masquée"
                aria-label="Clé API"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-3 partner-dashboard-pro">
      <div className="col-12">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1 className="h4 mb-1">{t("partnerDashboardTitle")}</h1>
            <div className="text-muted">{t("partnerDashboardSubtitle")}</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm sehily-btn-secondary d-flex align-items-center gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ["partner", "paiements"] })} disabled={partnerQuery.isFetching}>
              {partnerQuery.isFetching ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
              <span>{t("refresh")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label={t("kpiAssignedPayments")}
          value={assignedCount.toLocaleString()}
          subLabel={t("kpiAssignedPaymentsSub")}
          tone="info"
          icon={FiFileText}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label={t("kpiSentPayments")}
          value={waitingCount.toLocaleString()}
          subLabel={t("kpiSentPaymentsSub")}
          tone="warning"
          icon={FiClock}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label={t("kpiPaidPayments")}
          value={confirmedCount.toLocaleString()}
          subLabel={t("kpiPaidPaymentsSub")}
          tone="success"
          icon={FiCheckCircle}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label={t("kpiTotalAmount")}
          value={`${Math.round(totalAmount).toLocaleString()} MRU`}
          subLabel={t("kpiTotalAmountSub")}
          tone="accent"
          icon={FiDownload}
          variant="partner"
        />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <DashboardKpiCard
          label={t("today")}
          value={todayConfirmed.toLocaleString()}
          subLabel={t("kpiPaidPaymentsSub")}
          tone="neutral"
          icon={FiTrendingUp}
          variant="partner"
        />
      </div>

      <div className="col-12">
        <div className="row g-3">
          <div className="col-12 col-xxl-5">
            <div className="sehily-surface p-3">
              <div className="fw-bold mb-2">{t("partnerPaymentsByStatus")}</div>
              <div className="row g-3 align-items-center mt-1">
                <div className="col-12 col-md-6">
                  <div className="cnou-donut mx-auto" style={chartStyle}>
                    <div className="cnou-donut-inner">
                      <div className="text-center">
                        <div className="h5 mb-0">{assignedCount}</div>
                        <div className="small text-muted">{t("total")}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <ul className="list-unstyled mb-0 admin-legend-list">
                    <li><span className="admin-dot admin-dot-warning" /><span>{t("statusSent")}</span><strong>{waitingCount}</strong></li>
                    <li><span className="admin-dot admin-dot-success" /><span>{t("statusPaid")}</span><strong>{confirmedCount}</strong></li>
                    <li><span className="admin-dot admin-dot-info" /><span>{t("statusProcessing")}</span><strong>{inProgressCount}</strong></li>
                    <li><span className="admin-dot admin-dot-danger" /><span>{t("statusFailed")}</span><strong>{rejectedCount}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xxl-7">
            <div className="sehily-surface p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-bold">{t("partnerPaidTrend")}</div>
                <div className="small text-muted">{t("lastSixMonths")}</div>
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

          <div className="col-12">
            {renderPaymentsTable({ title: "Paiements à traiter", rows: pagedRows.slice(0, 5), mode: "embedded" })}
          </div>
          <div className="col-12">
            <div className="row g-3 partner-side-panels">
              <div className="col-12 col-xl-6">
                <div className="sehily-surface p-3 h-100 partner-side-card">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-bold">Notifications</div>
                    <span className="sehily-badge sehily-badge--warn">{unreadNotifications.length}</span>
                  </div>
                  <div className="small text-muted mb-3">Suivi des alertes récentes côté partenaire.</div>
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
              </div>
              <div className="col-12 col-xl-6">
                <div className="sehily-surface p-3 h-100 partner-side-card">
                  <div className="fw-bold mb-2">Actions rapides</div>
                  <div className="small text-muted mb-3">Pilotez les opérations prioritaires en un clic.</div>
                  <div className="admin-quick-actions-grid partner-quick-actions-grid">
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
            </div>
          </div>
        </div>
      </div>

      <ProcessConfirmModal payment={selectedPayment} onConfirm={confirmSelectedPayment} onClose={() => setSelectedPayment(null)} isPending={confirmMutation.isPending} />
    </div>
  );
}

