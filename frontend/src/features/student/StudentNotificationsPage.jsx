import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";

function formatNotifDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function StudentNotificationsPage() {
  const dossiersQuery = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });
  const paiementsQuery = useQuery({
    queryKey: ["student", "paiements"],
    queryFn: studentApi.listPaiements,
  });

  const generated = useMemo(() => {
    const dossiers = dossiersQuery.data?.results || dossiersQuery.data || [];
    const paiements = paiementsQuery.data || [];
    const dossierNotifs = dossiers.map((d) => ({
      id: `d-${d.id}`,
      titre: "Mise à jour dossier",
      message: `Votre dossier est au statut ${d.statut}.`,
      date: d.modifie_le || d.cree_le,
      lu: false,
    }));
    const paiementNotifs = paiements.map((p) => ({
      id: `p-${p.id}`,
      titre: "Mise à jour paiement",
      message: `Paiement #${p.id} statut: ${p.statut}.`,
      date: p.date_operation || new Date().toISOString(),
      lu: p.statut === "EFFECTUE",
    }));
    return [...paiementNotifs, ...dossierNotifs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  }, [dossiersQuery.data, paiementsQuery.data]);

  const [readMap, setReadMap] = useState({});

  const items = useMemo(
    () => generated.map((x) => ({ ...x, lu: readMap[x.id] ?? x.lu })),
    [generated, readMap],
  );
  const unreadCount = useMemo(() => items.filter((x) => !x.lu).length, [items]);

  function markRead(id) {
    setReadMap((prev) => ({ ...prev, [id]: true }));
  }

  function markAllRead() {
    const map = {};
    items.forEach((x) => {
      map[x.id] = true;
    });
    setReadMap(map);
  }

  if (dossiersQuery.isLoading || paiementsQuery.isLoading) return <LoadingSkeleton lines={6} />;

  const unreadLabel =
    unreadCount === 0 ? "À JOUR" : `${unreadCount} NON LUE${unreadCount > 1 ? "S" : ""}`;

  return (
    <div className="row g-4 student-notifications-page">
      <div className="col-12">
        <h1 className="h4 mb-1">Notifications</h1>
        <div className="text-muted">Messages système et état non lu.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="student-notif-toolbar">
            <span className={`sehily-badge ${unreadCount > 0 ? "sehily-badge--warn" : "sehily-badge--ok"}`}>{unreadLabel}</span>
            <button type="button" className="btn btn-sm student-notif-btn-markall d-inline-flex align-items-center gap-2" onClick={markAllRead}>
              <Check size={16} strokeWidth={2.5} aria-hidden />
              Tout marquer comme lu
            </button>
          </div>

          <div className="student-notif-list">
            {items.map((n) => (
              <article
                key={n.id}
                className={`student-notif-row ${n.lu ? "student-notif-row--read" : "student-notif-row--unread"}`}
                aria-label={n.lu ? "Notification lue" : "Notification non lue"}
              >
                <div className="student-notif-head">
                  <span
                    className={`student-notif-dot ${n.lu ? "student-notif-dot--read" : "student-notif-dot--unread"}`}
                    title={n.lu ? "Lu" : "Non lu"}
                    aria-hidden
                  />
                  <div className="student-notif-body">
                    <div className="student-notif-title-row">
                      <div className="student-notif-title">{n.titre}</div>
                      <time className="student-notif-date text-muted ms-auto" dateTime={n.date}>
                        {formatNotifDate(n.date)}
                      </time>
                    </div>
                    <p className="student-notif-msg mb-0">{n.message}</p>
                    <div className="student-notif-actions">
                      {n.lu ? (
                        <span className="student-notif-read-badge">✓ Lu</span>
                      ) : (
                        <button type="button" className="btn btn-sm student-notif-btn-read" onClick={() => markRead(n.id)}>
                          Marquer lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
