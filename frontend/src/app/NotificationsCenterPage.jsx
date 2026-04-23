import { useEffect, useMemo, useState } from "react";

import { adminApi, partnerApi } from "../features/api/webFeaturesApi";
import { getApiErrorMessage } from "../lib/apiError";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { useEffectiveRole } from "./session";

export function NotificationsCenterPage() {
  const { role } = useEffectiveRole();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (role === "PARTENAIRE") {
          const rows = await partnerApi.listOperationalPaiements();
          const waiting = rows.filter((r) => r.statut !== "EFFECTUE").length;
          const next = [
            { id: "p1", title: `${waiting} paiements en attente`, detail: "Traitement partenaire requis." },
            { id: "p2", title: "Mise à jour système", detail: "Une mise à jour est disponible." },
          ];
          if (active) setItems(next);
        } else {
          const dashboard = await adminApi.getDashboard();
          const pending = dashboard?.dossiers?.SOUMIS || 0;
          const next = [
            { id: "a1", title: `${pending} dossiers en attente`, detail: "Des dossiers nécessitent une validation CNOU." },
            { id: "a2", title: "Suivi exports", detail: "Les exports sont disponibles dans la section Exports." },
          ];
          if (active) setItems(next);
        }
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
  }, [role]);

  const title = useMemo(() => (role === "PARTENAIRE" ? "Notifications partenaire" : "Notifications CNOU"), [role]);

  if (loading) return <LoadingSkeleton lines={6} />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="row g-3">
      <div className="col-12">
        <h1 className="h4 mb-1">{title}</h1>
        <div className="text-muted">Centre de notifications opérationnelles.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          {items.length ? (
            <div className="d-grid gap-2">
              {items.map((n) => (
                <div key={n.id} className="admin-alert-item">
                  <div>
                    <div className="fw-semibold">{n.title}</div>
                    <div className="small text-muted">{n.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">Aucune notification disponible.</div>
          )}
        </div>
      </div>
    </div>
  );
}
