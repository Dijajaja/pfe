import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";

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
    [generated, readMap]
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

  if (dossiersQuery.isLoading || paiementsQuery.isLoading) return <div className="p-3">Chargement notifications...</div>;

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Notifications</h1>
        <div className="text-muted">Messages système et état non lu.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="sehily-badge sehily-badge--warn">{unreadCount} non lue(s)</span>
            <button className="btn btn-sm sehily-btn-secondary" onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          </div>

          <div className="d-grid gap-2">
            {items.map((n) => (
              <div key={n.id} className="border rounded-3 p-3">
                <div className="d-flex justify-content-between">
                  <div className="fw-semibold">{n.titre}</div>
                  <div className="text-muted small">{new Date(n.date).toLocaleString()}</div>
                </div>
                <div className="text-muted small mt-1">{n.message}</div>
                {!n.lu ? (
                  <button className="btn btn-sm sehily-btn-primary mt-2" onClick={() => markRead(n.id)}>
                    Marquer lu
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

