import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";
import { formatShortListeReference } from "../../lib/formatRefs";

function normalizeStatut(statut) {
  return String(statut || "")
    .trim()
    .toUpperCase();
}

function isPaiementRecu(statut) {
  return normalizeStatut(statut) === "EFFECTUE";
}

function PaiementStatutBadge({ statut }) {
  const u = normalizeStatut(statut);
  if (u === "EFFECTUE") {
    return <span className="student-pay-status-badge student-pay-status-badge--done">Effectué</span>;
  }
  if (u === "ENVOYE" || u === "EN_ATTENTE" || u === "EN_COURS") {
    const label = u === "ENVOYE" ? "Envoyé" : u === "EN_COURS" ? "En cours" : "En attente";
    return <span className="student-pay-status-badge student-pay-status-badge--pending">{label}</span>;
  }
  if (u === "ECHEC") {
    return <span className="student-pay-status-badge student-pay-status-badge--other">Échec</span>;
  }
  const raw = String(statut || "").trim();
  if (!raw) return <span className="student-pay-status-badge student-pay-status-badge--other">—</span>;
  return <span className="student-pay-status-badge student-pay-status-badge--other">{raw}</span>;
}

export function StudentPaiementsPage() {
  const [searchParams] = useSearchParams();
  const globalQ = (searchParams.get("q") || "").trim().toLowerCase();

  const { data, isLoading, error } = useQuery({
    queryKey: ["student", "paiements"],
    queryFn: studentApi.listPaiements,
  });

  const rows = useMemo(() => data || [], [data]);

  const filteredRows = useMemo(() => {
    if (!globalQ) return rows;
    return rows.filter((p) =>
      `${p.liste_reference || ""} ${p.reference_externe || ""} ${p.statut || ""} ${Number(p.montant || 0)}`
        .toLowerCase()
        .includes(globalQ),
    );
  }, [rows, globalQ]);

  const totalRecu = useMemo(
    () => rows.filter((p) => isPaiementRecu(p.statut)).reduce((acc, p) => acc + Number(p.montant || 0), 0),
    [rows],
  );

  if (isLoading) return <LoadingSkeleton lines={6} />;
  if (error) return <div className="alert alert-danger">{getApiErrorMessage(error, "Impossible de charger les paiements.")}</div>;

  return (
    <div className="row g-4 student-payments-page">
      <div className="col-12">
        <h1 className="h4 mb-1">Paiements</h1>
        <div className="text-muted">Suivi des paiements par période.</div>
      </div>
      <div className="col-12">
        <div className="partner-payments-stats-row">
          <div className="partner-payments-kpi">
            <div className="partner-payments-kpi-value">{totalRecu.toLocaleString("fr-FR")} MRU</div>
            <div className="partner-payments-kpi-label">Montant total reçu</div>
          </div>
        </div>
        <div className="sehily-surface p-3">
          <div className="table-responsive">
            <table className="table align-middle admin-table-pro admin-table-hover">
              <thead>
                <tr>
                  <th>Liste</th>
                  <th>Référence externe</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((p) => {
                  const { short, full } = formatShortListeReference(p.liste_reference);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="student-pay-liste-ref" title={full || undefined}>
                          {short}
                        </span>
                      </td>
                      <td>{p.reference_externe || "—"}</td>
                      <td>{Number(p.montant).toLocaleString("fr-FR")} MRU</td>
                      <td>
                        <PaiementStatutBadge statut={p.statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {globalQ && !filteredRows.length ? (
            <p className="small text-muted mb-0 mt-2">Aucun paiement ne correspond à « {searchParams.get("q")} ».</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
