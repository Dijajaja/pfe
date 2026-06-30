import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion as Motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";

import { EligibilityPetals } from "../components/public/EligibilityPetals";
import { saveEligibilityRef } from "../lib/eligibilityGate";
import { evaluerEligibiliteBackend } from "../lib/eligibilite";
import { vNni, vMatricule, inputState } from "../lib/validators";

function ValidationHint({ touched, result }) {
  if (!touched || !result) return null;
  return (
    <div className={`small mt-1 d-flex align-items-center gap-1 ${result.valid ? "text-success" : "text-danger"}`}>
      {result.valid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {result.msg}
    </div>
  );
}

export function EligibilitePage() {
  const { t } = useTranslation();
  const [nni, setNni] = useState("");
  const [matricule, setMatricule] = useState("");
  const [nniTouched, setNniTouched] = useState(false);
  const [matriculeTouched, setMatriculeTouched] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiLatencyMs, setApiLatencyMs] = useState(null);
  const [apiLatencyState, setApiLatencyState] = useState("idle");
  const [petalBurst, setPetalBurst] = useState(0);
  const outcomesAnchorRef = useRef(null);

  const nniValidation = vNni(nni);
  const matriculeValidation = vMatricule(matricule);
  const formValid = nniValidation.valid && matriculeValidation.valid;

  async function onSubmit(e) {
    e.preventDefault();
    setNniTouched(true);
    setMatriculeTouched(true);
    if (!formValid) return;
    const startedAt = performance.now();
    setIsSubmitting(true);
    setApiError("");
    setApiLatencyMs(null);
    setApiLatencyState("idle");
    setResult(null);
    try {
      const apiResult = await evaluerEligibiliteBackend({ nni, matricule });
      setResult(apiResult);
      if (apiResult.eligible) {
        saveEligibilityRef(apiResult);
        setPetalBurst((n) => n + 1);
      } else {
        saveEligibilityRef(null);
      }
      setApiLatencyMs(Math.round(performance.now() - startedAt));
      setApiLatencyState("ok");
    } catch (error) {
      setResult(null);
      saveEligibilityRef(null);
      setApiError(error?.response?.data?.detail || "API Django indisponible. Réessaie dans un instant.");
      setApiLatencyMs(Math.round(performance.now() - startedAt));
      setApiLatencyState("error");
    } finally {
      setIsSubmitting(false);
      window.setTimeout(() => {
        outcomesAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  const etudiant = result?.etudiant;
  const notFound = result && !result.found;
  const eligible = result?.found && result?.eligible;
  const notEligible = result?.found && !result?.eligible;

  return (
    <div className="rounded-4 p-2 p-md-3 public-modern eligibility-pro-page eligibility-pro-bg">
      <Motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="eligibility-pro-card p-4 p-md-5 rounded-5 mb-4"
      >
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill eligibility-pro-chip small fw-bold mb-3">
              <ShieldCheck size={14} />
              {t("secureVerification")}
            </div>
            <h1 className="display-6 fw-bold mb-2">{t("eligibilityTitle")}</h1>
            <p className="text-muted mb-0">Saisissez votre NNI et votre matricule pour vérifier votre éligibilité.</p>
          </div>
          <div className="d-flex align-items-start align-items-lg-center gap-2">
            {apiLatencyMs !== null && (
              <span className={`sehily-badge ${apiLatencyState === "ok" ? "sehily-badge--ok" : "sehily-badge--danger"}`}>
                <Clock3 size={15} /> {apiLatencyMs} ms
              </span>
            )}
            <Link to="/" className="btn sehily-btn-secondary">
              {t("backHome")}
            </Link>
          </div>
        </div>
      </Motion.div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <Motion.form
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={onSubmit}
            className="eligibility-pro-card p-4 p-md-5 rounded-5"
          >
            <h2 className="h4 fw-bold mb-4 text-start eligibility-form-title">Vérification d&apos;identité</h2>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldNni")}</label>
                <input
                  className={`form-control ${inputState(nniTouched, nniValidation.valid)}`}
                  placeholder="Ex: 0123456789"
                  value={nni}
                  onChange={(e) => { setNni(e.target.value); setNniTouched(true); }}
                  onBlur={() => setNniTouched(true)}
                  inputMode="numeric"
                  maxLength={10}
                />
                <ValidationHint touched={nniTouched} result={nniValidation} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldMatricule")}</label>
                <input
                  className={`form-control ${inputState(matriculeTouched, matriculeValidation.valid)}`}
                  placeholder="Ex: I25099"
                  value={matricule}
                  onChange={(e) => { setMatricule(e.target.value); setMatriculeTouched(true); }}
                  onBlur={() => setMatriculeTouched(true)}
                  maxLength={6}
                />
                <ValidationHint touched={matriculeTouched} result={matriculeValidation} />
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <button
                className="btn sehily-btn-primary px-4 d-inline-flex align-items-center gap-2"
                type="submit"
                disabled={isSubmitting || (nniTouched && matriculeTouched && !formValid)}
              >
                <Search size={16} />
                {isSubmitting ? t("checking") : t("checkEligibility")}
              </button>
            </div>
          </Motion.form>
        </div>

        <div className="col-12 col-lg-4">
          <Motion.aside
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            className="eligibility-pro-card p-4 p-md-5 rounded-5 h-100"
          >
            <h3 className="h5 fw-bold mb-4">{t("howItWorks")}</h3>
            <div className="d-grid gap-3 small text-muted">
              <div>1. Saisissez votre NNI et matricule</div>
              <div>2. Le CNOU vérifie votre identité</div>
              <div>3. Consultez votre éligibilité et créez votre compte</div>
            </div>
          </Motion.aside>
        </div>
      </div>

      <div ref={outcomesAnchorRef} className="eligibility-pro-outcomes-anchor">
        {apiError ? (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-warning mt-4 mb-0">
            <AlertCircle size={15} className="me-2" />
            {apiError}
          </Motion.div>
        ) : null}

        {notFound ? (
          <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-4 eligibility-pro-result-ko">
            <div className="fw-bold eligibility-pro-danger mb-2 d-flex align-items-center gap-2">
              <AlertCircle size={17} /> Étudiant introuvable
            </div>
            <div className="text-muted">{result.message}</div>
            <button type="button" className="btn sehily-btn-secondary mt-3" disabled>
              {t("continueToRegistration")}
            </button>
          </Motion.div>
        ) : null}

        {result?.found && etudiant ? (
          <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eligibility-pro-card p-4 p-md-5 rounded-5 mt-4">
            <h3 className="h5 fw-bold mb-3">Informations étudiant</h3>
            <div className="row g-3 mb-4">
              {[
                ["Nom complet", etudiant.nom_complet],
                ["Wilaya", etudiant.wilaya],
                ["Établissement", etudiant.etablissement],
                ["Formation", etudiant.formation],
                ["Année courante", etudiant.annee_courante],
              ].map(([label, value]) => (
                <div className="col-12 col-md-6" key={label}>
                  <label className="form-label small text-muted mb-1">{label}</label>
                  <input className="form-control" value={value || ""} readOnly disabled />
                </div>
              ))}
            </div>
          </Motion.div>
        ) : null}

        {eligible ? (
          <div className="eligibility-pro-result-ok-wrap rounded-5 mt-4">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eligibility-pro-result-ok p-4 p-md-5 rounded-5 text-center">
              <div className="eligibility-pro-result-stack">
                <span className="sehily-badge sehily-badge--ok mb-3">
                  <CheckCircle2 size={15} /> Éligible
                </span>
                <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle eligibility-pro-result-icon">
                  <Banknote size={36} className="eligibility-pro-icon" />
                </div>
                <p className="eligibility-pro-result-detail text-muted mb-0 mt-3">{result.message}</p>
                <div className="eligibility-pro-result-actions mt-3">
                  {result.has_account ? (
                    <Link className="btn sehily-btn-primary px-4 d-inline-flex align-items-center gap-2" to="/auth/login?from=eligibilite">
                      Se connecter
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link className="btn sehily-btn-primary px-4 d-inline-flex align-items-center gap-2" to="/auth/register?from=eligibilite">
                      Créer mon compte
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </Motion.div>
            <EligibilityPetals burstId={petalBurst} />
          </div>
        ) : null}

        {notEligible ? (
          <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-4 eligibility-pro-result-ko">
            <div className="fw-bold eligibility-pro-danger mb-2 d-flex align-items-center gap-2">
              <AlertCircle size={17} /> Non éligible
            </div>
            <div className="text-muted">{result.motif || result.message}</div>
            <button type="button" className="btn sehily-btn-secondary mt-3" disabled>
              Créer mon compte
            </button>
          </Motion.div>
        ) : null}
      </div>
    </div>
  );
}
