import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { referentialApi, studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

const STATUS_TO_TIMELINE_INDEX = {
  BROUILLON: 0,
  SOUMIS: 1,
  EN_INSTRUCTION: 2,
  COMPLEMENT_DEMANDE: 2,
  VALIDE: 3,
  REJETE: 4,
};

function StudentFolderStatusBadge({ statut, t }) {
  if (statut === "EN_INSTRUCTION" || statut === "COMPLEMENT_DEMANDE")
    return <span className="student-dash-folder-status student-dash-folder-status--warn">{t("stepInInstruction")}</span>;
  if (statut === "VALIDE") return <span className="student-dash-folder-status student-dash-folder-status--ok">{t("statusValidated")}</span>;
  if (statut === "REJETE") return <span className="student-dash-folder-status student-dash-folder-status--danger">{t("stepRejected")}</span>;
  if (statut === "SOUMIS") return <span className="student-dash-folder-status student-dash-folder-status--neutral">{t("statusSubmitted")}</span>;
  if (statut === "BROUILLON") return <span className="student-dash-folder-status student-dash-folder-status--muted">{t("stepDraftCreated")}</span>;
  return <span className="student-dash-folder-status student-dash-folder-status--muted">{statut}</span>;
}

function TimelineStepIcon({ status, index }) {
  if (status === "done") {
    return <CheckCircle2 className="student-timeline-step-icon student-timeline-step-icon--done" size={26} strokeWidth={2} aria-hidden />;
  }
  if (status === "current") {
    return (
      <div className="student-timeline-step-icon-wrap student-timeline-step-icon-wrap--current" aria-hidden>
        <ArrowRight size={18} strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <span className="student-timeline-step-icon student-timeline-step-icon--todo" aria-hidden>
      {index + 1}
    </span>
  );
}

function resolveAnneeLibelle(anneeId, annees) {
  if (anneeId == null || anneeId === "") return null;
  const row = (annees || []).find((a) => a.id === anneeId || String(a.id) === String(anneeId));
  return row?.libelle ?? null;
}

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
}

export function StudentDashboardPage() {
  const { t } = useTranslation();
  const { pushError } = useAppToast();

  const ORDERED_STEPS = useMemo(
    () => [
      { key: "BROUILLON", label: t("stepDraftCreated") },
      { key: "SOUMIS", label: t("stepSubmitted") },
      { key: "EN_INSTRUCTION", label: t("stepInInstruction") },
      { key: "VALIDE", label: t("stepValidatedCnou") },
      { key: "REJETE", label: t("stepRejected") },
    ],
    [t],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });

  const anneesQuery = useQuery({
    queryKey: ["referential", "annees-actives"],
    queryFn: referentialApi.listAnneesActives,
  });

  useEffect(() => {
    if (error) pushError(getApiErrorMessage(error, "Impossible de charger le dashboard étudiant."));
  }, [error, pushError]);

  const dossiers = data?.results || data || [];
  const dossier = dossiers[0] || null;

  const timelineIndex = useMemo(() => {
    if (!dossier) return -1;
    const mapped = STATUS_TO_TIMELINE_INDEX[dossier.statut];
    if (typeof mapped === "number") return mapped;
    return ORDERED_STEPS.findIndex((s) => s.key === dossier.statut);
  }, [dossier, ORDERED_STEPS]);

  const timeline = useMemo(() => {
    if (!dossier) return [];
    const idx = timelineIndex < 0 ? 0 : timelineIndex;

    const dateIsoForStep = (stepKey, i) => {
      if (stepKey === "BROUILLON") return dossier.cree_le || null;
      if (stepKey === "SOUMIS") return dossier.date_soumission || null;
      if (i === idx) {
        if (stepKey === "EN_INSTRUCTION" || stepKey === "VALIDE" || stepKey === "REJETE") return dossier.modifie_le || null;
      }
      if (i < idx && stepKey === "EN_INSTRUCTION") return dossier.modifie_le || dossier.date_soumission || null;
      return null;
    };

    return ORDERED_STEPS.map((step, i) => ({
      ...step,
      statut: i < idx ? "done" : i === idx ? "current" : "todo",
      dateIso: dateIsoForStep(step.key, i),
    }));
  }, [dossier, ORDERED_STEPS, timelineIndex]);

  const anneeDisplay = useMemo(() => {
    if (!dossier) return { main: "", hint: "" };
    const lib = resolveAnneeLibelle(dossier.annee_universitaire, anneesQuery.data || []);
    if (lib) return { main: lib, hint: t("studentAcademicYearHint") };
    if (dossier.niveau) return { main: dossier.niveau, hint: t("studentLevelStudyHint") };
    return { main: t("studentAcademicYearUnknown"), hint: t("studentAcademicYearHint") };
  }, [dossier, anneesQuery.data, t]);

  const progressPct = useMemo(() => {
    const e = timelineIndex < 0 ? 0 : timelineIndex;
    if (ORDERED_STEPS.length <= 1) return 0;
    return Math.round((e / (ORDERED_STEPS.length - 1)) * 100);
  }, [timelineIndex, ORDERED_STEPS.length]);

  const timelineDotIndex = Math.max(0, timelineIndex);

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
    <div className="student-dashboard-pro">
      <div className="row g-4">
        <div className="col-12">
          <h1 className="h4 mb-1">{t("studentDashboardTitle")}</h1>
          <div className="text-muted">{t("studentDashboardSubtitle")}</div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="student-dash-folder-shell h-100 d-flex flex-column">
            <div className="student-dash-folder-head d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2">
              <span className="fw-semibold text-white mb-0">{t("studentDashMyFolder")}</span>
              <div className="student-dash-folder-head-badges">
                <StudentFolderStatusBadge statut={dossier.statut} t={t} />
              </div>
            </div>
            <div className="p-3 d-flex flex-column flex-grow-1">
              <div className="student-dash-kv">
                <span className="student-dash-kv-label">{t("studentDossierNumber")}</span>
                <span className="student-dash-kv-value">DOS-{String(dossier.id).padStart(6, "0")}</span>
              </div>
              <div className="student-dash-kv mt-2">
                <span className="student-dash-kv-label">{t("studentAcademicYearLabel")}</span>
                <span className="student-dash-kv-value">{anneeDisplay.main}</span>
              </div>
              {anneeDisplay.hint ? <div className="small text-muted mt-1">{anneeDisplay.hint}</div> : null}

              <div className="student-dash-kv student-dash-kv--amount mt-3">
                <span className="student-dash-kv-label">{t("studentExpectedAmount")}</span>
                <span className="student-dash-kv-value student-dash-kv-value--amount">{Number(dossier.montant_bourse || 0).toLocaleString()} MRU</span>
              </div>

              <div className="student-dash-progress-block mt-3">
                <div className="d-flex justify-content-between align-items-baseline mb-1">
                  <span className="small text-muted">{t("studentDossierProgressLabel")}</span>
                  <span className="small fw-semibold student-dash-progress-pct">{progressPct}%</span>
                </div>
                <div className="student-dash-progress-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="student-dash-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="student-dash-steps mt-2" aria-hidden="true">
                  {ORDERED_STEPS.map((s, i) => (
                    <div
                      key={s.key}
                      className={`student-dash-step-dot ${i < timelineDotIndex ? "is-done" : ""} ${i === timelineDotIndex ? "is-current" : ""}`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>

              <div className="d-flex flex-column flex-sm-row flex-wrap gap-2 mt-auto pt-3 student-dash-actions border-top">
                <Link to="/app/student/dossier" className="btn btn-sm student-dash-btn-outline text-center">
                  {t("studentActionViewDossier")}
                </Link>
                <Link to="/app/student/reclamations" className="btn btn-sm student-dash-btn-reclam text-center">
                  {t("studentActionReclamation")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="student-dash-progress-shell h-100 d-flex flex-column">
            <div className="student-dash-progress-shell-head px-3 py-2 fw-bold">{t("studentDashProgressCardTitle")}</div>
            <div className="p-3 flex-grow-1">
              <div className="d-grid gap-2 student-dashboard-timeline">
                {timeline.map((step, i) => {
                  const formatted = formatDateTime(step.dateIso);
                  const pillClass =
                    step.statut === "done"
                      ? "student-timeline-pill student-timeline-pill--done"
                      : step.statut === "current"
                        ? "student-timeline-pill student-timeline-pill--current"
                        : "student-timeline-pill student-timeline-pill--todo";
                  const label =
                    step.statut === "done" ? t("timelineDone") : step.statut === "current" ? t("timelineCurrent") : t("timelineUpcoming");
                  return (
                    <div key={step.key} className="student-timeline-rich-row d-flex align-items-center gap-3 border rounded-3 px-3 py-2">
                      <TimelineStepIcon status={step.statut} index={i} />
                      <div className="min-w-0 flex-grow-1">
                        <div className="fw-semibold">{step.label}</div>
                        {formatted ? (
                          <div className="text-muted small mt-1">{formatted}</div>
                        ) : (
                          <div className="student-timeline-date-pending mt-1">{t("studentTimelineDatePending")}</div>
                        )}
                      </div>
                      <span className={pillClass}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
