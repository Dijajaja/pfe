import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

const ORDERED_STEPS = [
  { key: "BROUILLON", label: "Brouillon créé" },
  { key: "SOUMIS", label: "Dossier soumis" },
  { key: "EN_INSTRUCTION", label: "En instruction" },
  { key: "VALIDE", label: "Validé CNOU" },
  { key: "REJETE", label: "Rejeté" },
];

function StatusBadge({ statut }) {
  if (statut === "EN_INSTRUCTION") return <span className="sehily-badge sehily-badge--warn">En instruction</span>;
  if (statut === "VALIDE") return <span className="sehily-badge sehily-badge--ok">Validé</span>;
  return <span className="sehily-badge sehily-badge--danger">{statut}</span>;
}

export function StudentDashboardPage() {
  const { pushError } = useAppToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });
  useEffect(() => {
    if (error) pushError(getApiErrorMessage(error, "Impossible de charger le dashboard étudiant."));
  }, [error, pushError]);

  const dossiers = data?.results || data || [];
  const dossier = dossiers[0] || null;

  const timeline = useMemo(() => {
    if (!dossier) return [];
    const idx = ORDERED_STEPS.findIndex((s) => s.key === dossier.statut);
    return ORDERED_STEPS.map((step, i) => ({
      ...step,
      statut: i < idx ? "done" : i === idx ? "current" : "todo",
      date:
        i === 0
          ? dossier.cree_le
          : i === 1 && dossier.date_soumission
            ? dossier.date_soumission
            : "-",
    }));
  }, [dossier]);

  if (isLoading) {
    return <LoadingSkeleton lines={7} />;
  }

  if (!dossier) {
    return (
      <div className="sehily-surface p-4">
        <h1 className="h5 mb-2">Aucun dossier trouvé</h1>
        <div className="text-muted">Crée ton premier dossier dans la section “Dossier & documents”.</div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Espace étudiant — Dashboard</h1>
        <div className="text-muted">Résumé dossier, statut courant et timeline.</div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="sehily-surface p-3 h-100">
          <div className="text-muted small">Numéro dossier</div>
          <div className="fw-bold">DOS-{String(dossier.id).padStart(6, "0")}</div>
          <hr />
          <div className="text-muted small">Année</div>
          <div className="fw-semibold">{dossier.annee_universitaire}</div>
          <hr />
          <div className="text-muted small">Montant prévu</div>
          <div className="fw-semibold">{Number(dossier.montant_bourse || 0).toLocaleString()} MRU</div>
          <hr />
          <StatusBadge statut={dossier.statut} />
        </div>
      </div>

      <div className="col-12 col-lg-8">
        <div className="sehily-surface p-3 h-100">
          <div className="fw-bold mb-3">Timeline</div>
          <div className="d-grid gap-2">
            {timeline.map((step) => (
              <div key={step.key} className="d-flex align-items-center justify-content-between border rounded-3 px-3 py-2">
                <div>
                  <div className="fw-semibold">{step.label}</div>
                  <div className="text-muted small">
                    {step.date && step.date !== "-" ? new Date(step.date).toLocaleString() : "-"}
                  </div>
                </div>
                <span
                  className={`sehily-badge ${
                    step.statut === "done"
                      ? "sehily-badge--ok"
                      : step.statut === "current"
                        ? "sehily-badge--warn"
                        : "sehily-badge--danger"
                  }`}
                >
                  {step.statut === "done" ? "Terminé" : step.statut === "current" ? "En cours" : "À venir"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

