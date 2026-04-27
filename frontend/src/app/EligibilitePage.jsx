import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldCheck,
} from "lucide-react";

import { evaluerEligibiliteBackend } from "../lib/eligibilite";

const WILAYAS = [
  "Adrar",
  "Assaba",
  "Brakna",
  "Dakhlet Nouadhibou",
  "Gorgol",
  "Guidimakha",
  "Hodh Ech Chargui",
  "Hodh El Gharbi",
  "Inchiri",
  "Nouakchott-Nord",
  "Nouakchott-Ouest",
  "Nouakchott-Sud",
  "Tagant",
  "Tiris Zemmour",
  "Trarza",
];

const NIVEAUX = [
  { value: "L1", label: "L1" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
  { value: "M1", label: "Master 1" },
  { value: "M2", label: "Master 2" },
];

function calcAgeYears(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const md = now.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function EligibilitePage() {
  const { t } = useTranslation();
  const [nni, setNni] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [niveau, setNiveau] = useState("L1");
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiLatencyMs, setApiLatencyMs] = useState(null);
  const [apiLatencyState, setApiLatencyState] = useState("idle");

  const age = useMemo(() => (dateNaissance ? calcAgeYears(dateNaissance) : null), [dateNaissance]);

  async function onSubmit(e) {
    e.preventDefault();
    const startedAt = performance.now();
    setIsSubmitting(true);
    setApiError("");
    setApiLatencyMs(null);
    setApiLatencyState("idle");
    try {
      const apiResult = await evaluerEligibiliteBackend({
        nni,
        dateNaissance,
        wilayaBac: wilaya,
        niveau,
      });
      setResult({ ...apiResult, ok: Boolean(apiResult.ok) });
      setApiLatencyMs(Math.round(performance.now() - startedAt));
      setApiLatencyState("ok");
    } catch (error) {
      setResult(null);
      setApiError(error?.response?.data?.detail || "API Django indisponible. Réessaie dans un instant.");
      setApiLatencyMs(Math.round(performance.now() - startedAt));
      setApiLatencyState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-4 p-2 p-md-3 public-modern eligibility-pro-page eligibility-pro-bg">
      <motion.div
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
            <p className="text-muted mb-0">{t("eligibilitySubtitle")}</p>
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
      </motion.div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <motion.form
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            onSubmit={onSubmit}
            className="eligibility-pro-card p-4 p-md-5 rounded-5"
          >
            <h2 className="h4 fw-bold mb-4">{t("personalInfo")}</h2>

            <div className="row g-4">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldNni")}</label>
                <input
                  className="form-control"
                  placeholder="Ex: 1234567890"
                  value={nni}
                  onChange={(e) => setNni(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldBirthdate")}</label>
                <div className="position-relative">
                  <input
                    type="date"
                    className="form-control pe-5"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    required
                  />
                  <Calendar size={18} className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                </div>
                {age !== null && <div className="small eligibility-pro-success mt-2 fw-semibold">{t("computedAge", { age })}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldWilayaBac")}</label>
                <select className="form-select" value={wilaya} onChange={(e) => setWilaya(e.target.value)} required>
                  <option value="">{t("selectPlaceholder")}</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("fieldLevel")}</label>
                <select className="form-select" value={niveau} onChange={(e) => setNiveau(e.target.value)} required>
                  {NIVEAUX.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button className="btn sehily-btn-primary px-4 d-inline-flex align-items-center gap-2" type="submit" disabled={isSubmitting}>
                <Search size={16} />
                {isSubmitting ? t("checking") : t("checkEligibility")}
              </button>
              <Link className="btn sehily-btn-secondary px-4" to="/auth/login">
                {t("loginTitle")}
              </Link>
            </div>
          </motion.form>
        </div>

        <div className="col-12 col-lg-4">
          <motion.aside
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="eligibility-pro-card p-4 p-md-5 rounded-5 h-100"
          >
            <h3 className="h5 fw-bold mb-4">{t("howItWorks")}</h3>
            <div className="d-grid gap-3">
              <div className="d-flex align-items-start gap-2">
                <FileText size={16} className="mt-1 eligibility-pro-icon" />
                <span className="small text-muted">{t("sidebarItem0")}</span>
              </div>
              <div className="d-flex align-items-start gap-2">
                <Clock3 size={16} className="mt-1 eligibility-pro-icon" />
                <span className="small text-muted">{t("sidebarItem1")}</span>
              </div>
              <div className="d-flex align-items-start gap-2">
                <CheckCircle2 size={16} className="mt-1 eligibility-pro-icon" />
                <span className="small text-muted">{t("sidebarItem2")}</span>
              </div>
            </div>
            <div className="alert eligibility-pro-note small mt-4 mb-0">
              <AlertCircle size={15} className="me-2" />
              {t("officialDocumentsNote")}
            </div>
          </motion.aside>
        </div>
      </div>

      {apiError ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-warning mt-4 mb-0">
          <AlertCircle size={15} className="me-2" />
          {apiError}
        </motion.div>
      ) : null}

      {result?.ok ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 eligibility-pro-result-ok p-4 p-md-5 rounded-5 text-center">
          <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle eligibility-pro-result-icon">
            <Banknote size={36} className="eligibility-pro-icon" />
          </div>
          <div className="fw-bold text-uppercase mb-2">{t("eligibleScholarshipTitle")}</div>
          {result.i18nKey ? <p className="text-muted mb-3">{t(result.i18nKey, result.i18nParams || {})}</p> : null}
          <Link className="btn sehily-btn-primary px-4 d-inline-flex align-items-center gap-2" to="/auth/register?from=eligibilite">
            {t("continueToRegistration")}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      ) : null}

      {result && !result.ok ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-4 eligibility-pro-result-ko">
          <div className="fw-bold eligibility-pro-danger mb-2 d-flex align-items-center gap-2">
            <AlertCircle size={17} /> {t("eligibleNo")}
          </div>
          <div className="text-muted">{t(result.i18nKey, result.i18nParams || {})}</div>
        </motion.div>
      ) : null}
    </div>
  );
}
