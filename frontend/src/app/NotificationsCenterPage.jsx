import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { adminApi, partnerApi, studentApi } from "../features/api/webFeaturesApi";
import { useAppToast } from "../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../lib/apiError";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import {
  appendNotificationCenterReadId,
  getNotificationCenterReadIds,
  setNotificationCenterReadIds,
} from "../lib/notificationCenterRead";
import { useCurrentUser, useEffectiveRole } from "./session";
import { tokenStore } from "../lib/api";

function dossiersList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
}

async function buildAdminItems(t) {
  const dash = await adminApi.getDashboard();
  const d = dash?.dossiers || {};
  const pending = Number(d.SOUMIS || 0) + Number(d.EN_INSTRUCTION || 0);
  let recOpen = 0;
  try {
    const recs = await adminApi.listReclamations();
    recOpen = (recs || []).filter((r) => r.statut !== "TRAITEE").length;
  } catch {
    /* liste optionnelle */
  }
  const at = new Date().toISOString();
  return [
    {
      id: "nc-admin-dossiers",
      title: t("notifCenterAdminDossiers", { count: pending }),
      detail: t("notifCenterAdminDossiersDetail"),
      at,
    },
    {
      id: "nc-admin-reclamations",
      title: t("notifCenterAdminReclamations", { count: recOpen }),
      detail: t("notifCenterAdminReclamationsDetail"),
      at,
    },
    {
      id: "nc-admin-exports",
      title: t("notifCenterAdminExport"),
      detail: t("notifCenterAdminExportDetail"),
      at,
    },
  ];
}

async function buildPartnerItems(t) {
  const rows = await partnerApi.listOperationalPaiements();
  const waiting = (rows || []).filter((r) => r.statut !== "EFFECTUE").length;
  const at = new Date().toISOString();
  return [
    {
      id: "nc-partner-waiting",
      title: t("notifCenterPartnerWaiting", { count: waiting }),
      detail: t("notifCenterPartnerWaitingDetail"),
      at,
    },
    {
      id: "nc-partner-practices",
      title: t("notifCenterPartnerInfo"),
      detail: t("notifCenterPartnerInfoDetail"),
      at,
    },
  ];
}

async function buildStudentItems(t) {
  const dossRes = await studentApi.listDossiers();
  const dossiers = dossiersList(dossRes);
  const main = dossiers[0];
  const paiements = await studentApi.listPaiements();
  const payCount = Array.isArray(paiements) ? paiements.length : 0;
  const recs = await studentApi.listReclamations();
  const recCount = Array.isArray(recs) ? recs.length : 0;
  const at = new Date().toISOString();
  const items = [];
  if (main) {
    items.push({
      id: "nc-student-dossier",
      title: t("notifCenterStudentDossier"),
      detail: t("notifCenterStudentDossierDetail", { statut: main.statut || "—" }),
      at,
    });
  } else {
    items.push({
      id: "nc-student-no-dossier",
      title: t("notifCenterStudentNoDossier"),
      detail: t("notifCenterStudentNoDossierDetail"),
      at,
    });
  }
  items.push({
    id: "nc-student-paiements",
    title: t("notifCenterStudentPaiements"),
    detail: t("notifCenterStudentPaiementsDetail", { count: payCount }),
    at,
  });
  items.push({
    id: "nc-student-reclamations",
    title: t("notifCenterStudentReclamations"),
    detail: t("notifCenterStudentReclamationsDetail", { count: recCount }),
    at,
  });
  return items;
}

export function NotificationsCenterPage() {
  const { t, i18n } = useTranslation();
  const me = useCurrentUser();
  const { role } = useEffectiveRole();
  const { pushInfo } = useAppToast();
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => getNotificationCenterReadIds(role));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setReadIds(getNotificationCenterReadIds(role));
  }, [role]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (role == null) {
        if (active) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError("");
      try {
        let next = [];
        if (role === "PARTENAIRE") next = await buildPartnerItems(t);
        else if (role === "ETUDIANT") next = await buildStudentItems(t);
        else if (role === "ADMIN") next = await buildAdminItems(t);
        if (active) setItems(next);
      } catch (e) {
        if (active) setError(getApiErrorMessage(e, "Impossible de charger les notifications."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [role, t]);

  const pageTitle = useMemo(() => {
    if (role == null) return t("notifCenterPageTitleGeneric");
    if (role === "PARTENAIRE") return t("notifCenterPageTitlePartner");
    if (role === "ETUDIANT") return t("notifCenterPageTitleStudent");
    return t("notifCenterPageTitleAdmin");
  }, [role, t]);

  const timeLocale = i18n.language?.startsWith("ar") ? "ar" : "fr-FR";

  const formatAt = useCallback(
    (iso) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString(timeLocale, { dateStyle: "short", timeStyle: "short" });
    },
    [timeLocale],
  );

  function markOne(id) {
    if (readIds.includes(id)) return;
    appendNotificationCenterReadId(role, id);
    setReadIds(getNotificationCenterReadIds(role));
    pushInfo(t("notifCenterToastMarked"));
  }

  function markAllRead() {
    const ids = items.map((x) => x.id);
    setNotificationCenterReadIds(role, ids);
    setReadIds(getNotificationCenterReadIds(role));
    pushInfo(t("notifCenterToastAllRead"));
  }

  const unreadCount = useMemo(() => items.filter((n) => !readIds.includes(n.id)).length, [items, readIds]);

  const sessionAwaitingRole = !!tokenStore.get()?.access && me.isLoading;

  if (sessionAwaitingRole) {
    return <LoadingSkeleton lines={6} />;
  }

  if (loading) return <LoadingSkeleton lines={6} />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="row g-3">
      <div className="col-12 d-flex flex-wrap align-items-start justify-content-between gap-2">
        <div>
          <h1 className="h4 mb-1">{pageTitle}</h1>
          <p className="text-muted mb-0 small" style={{ maxWidth: "42rem" }}>
            {t("notifCenterSubtitle")}
          </p>
        </div>
        {items.length > 0 && unreadCount > 0 ? (
          <button type="button" className="btn btn-sm sehily-btn-secondary" onClick={markAllRead}>
            {t("notifCenterMarkAllRead")}
          </button>
        ) : null}
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          {items.length ? (
            <div className="d-grid gap-2">
              {items.map((n) => {
                const read = readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`admin-alert-item notif-center-item ${read ? "" : "admin-alert-item--unread"}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => markOne(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        markOne(n.id);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-grow-1">
                      <div className="fw-semibold">{n.title}</div>
                      <div className="small text-muted">{n.detail}</div>
                      <div className="small text-muted mt-1">{t("notifCenterTimeLabel", { time: formatAt(n.at) })}</div>
                    </div>
                    {!read ? (
                      <span className="sehily-badge sehily-badge--warn flex-shrink-0">{t("notifCenterBadgeNew")}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted">{t("notifCenterEmpty")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
