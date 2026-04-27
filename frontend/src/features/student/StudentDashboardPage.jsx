import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

function StatusBadge({ statut, t }) {
  if (statut === "EN_INSTRUCTION") return <span className="sehily-badge sehily-badge--warn">{t("stepInInstruction")}</span>;
  if (statut === "VALIDE") return <span className="sehily-badge sehily-badge--ok">{t("statusValidated")}</span>;
  return <span className="sehily-badge sehily-badge--danger">{statut}</span>;
}

export function StudentDashboardPage() {
  const { t } = useTranslation();
  const ORDERED_STEPS = [
    { key: "BROUILLON", label: t("stepDraftCreated") },
    { key: "SOUMIS", label: t("stepSubmitted") },
    { key: "EN_INSTRUCTION", label: t("stepInInstruction") },
    { key: "VALIDE", label: t("stepValidatedCnou") },
    { key: "REJETE", label: t("stepRejected") },
  ];
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
        <h1 className="h5 mb-2">{t("studentNoDossierTitle")}</h1>
        <div className="text-muted">{t("studentNoDossierDesc")}</div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">{t("studentDashboardTitle")}</h1>
        <div className="text-muted">{t("studentDashboardSubtitle")}</div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="sehily-surface p-3 h-100">
          <div className="text-muted small">{t("studentDossierNumber")}</div>
          <div className="fw-bold">DOS-{String(dossier.id).padStart(6, "0")}</div>
          <hr />
          <div className="text-muted small">{t("studentYear")}</div>
          <div className="fw-semibold">{dossier.annee_universitaire}</div>
          <hr />
          <div className="text-muted small">{t("studentExpectedAmount")}</div>
          <div className="fw-semibold">{Number(dossier.montant_bourse || 0).toLocaleString()} MRU</div>
          <hr />
          <StatusBadge statut={dossier.statut} t={t} />
        </div>
      </div>

      <div className="col-12 col-lg-8">
        <div className="sehily-surface p-3 h-100">
          <div className="fw-bold mb-3">{t("timeline")}</div>
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
                  {step.statut === "done" ? t("timelineDone") : step.statut === "current" ? t("timelineCurrent") : t("timelineUpcoming")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

