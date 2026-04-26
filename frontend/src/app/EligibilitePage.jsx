import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Clock3, FileText, ShieldCheck, Banknote } from "lucide-react";

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
  "Nouakchott",
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
    <div className="elig-pro-page rounded-4 p-2 p-md-3" style={{ backgroundColor: "#f5f4ef" }}>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sehily-surface p-3 p-md-4 mb-3"
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <span className="sehily-badge sehily-badge--ok mb-2">
              <ShieldCheck size={16} /> Verification securisee
            </span>
            <h1 className="h3 mb-2 fw-bold text-dark">{t("eligibilityTitle")}</h1>
            <p className="text-muted mb-0">{t("eligibilitySubtitle")}</p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {apiLatencyMs !== null && (
              <span className={`sehily-badge ${apiLatencyState === "ok" ? "sehily-badge--ok" : "sehily-badge--danger"}`}>
                <Clock3 size={15} /> {apiLatencyMs} ms
              </span>
            )}
            <Link className="btn sehily-btn-secondary" to="/">
              {t("backHome")}
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sehily-surface p-3 p-md-4"
            onSubmit={onSubmit}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 mb-0 fw-bold">Informations personnelles</h2>
              {age !== null && <span className="sehily-badge sehily-badge--warn">{t("computedAge", { age })}</span>}
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold" htmlFor="nni">
                  {t("fieldNni")}
                </label>
                <input
                  id="nni"
                  className="form-control"
                  value={nni}
                  onChange={(e) => setNni(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ex: 1234567890"
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold" htmlFor="dob">
                  {t("fieldBirthdate")}
                </label>
                <input
                  id="dob"
                  type="date"
                  className="form-control"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold" htmlFor="wilaya">
                  {t("fieldWilayaBac")}
                </label>
                <select
                  id="wilaya"
                  className="form-select"
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  required
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold" htmlFor="niveau">
                  {t("fieldLevel")}
                </label>
                <select
                  id="niveau"
                  className="form-select"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  required
                >
                  {NIVEAUX.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn sehily-btn-primary px-4" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Verification..." : t("checkEligibility")}
              </button>
              <Link className="btn sehily-btn-secondary" to="/auth/login">
                Connexion
              </Link>
            </div>
          </motion.form>
        </div>

        <div className="col-12 col-lg-4">
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="sehily-surface p-3 p-md-4 h-100"
          >
            <h3 className="h6 fw-bold mb-3">Comment ca fonctionne ?</h3>
            <ul className="list-unstyled mb-3 d-grid gap-2">
              <li className="d-flex align-items-start gap-2">
                <FileText size={16} className="mt-1" style={{ color: "var(--sehily-petrole)" }} />
                <span className="small text-muted">Saisissez vos informations académiques et administratives.</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <Clock3 size={16} className="mt-1" style={{ color: "var(--sehily-petrole)" }} />
                <span className="small text-muted">La vérification est traitée rapidement après soumission du formulaire.</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <CheckCircle2 size={16} className="mt-1" style={{ color: "var(--sehily-petrole)" }} />
                <span className="small text-muted">Si vous êtes éligible, vous pouvez créer votre compte immédiatement.</span>
              </li>
            </ul>
            <div className="alert alert-light border small mb-0">
              <AlertCircle size={15} className="me-2" style={{ color: "var(--sehily-petrole)" }} />
              {t("eligibilityNote")}
            </div>
          </motion.aside>
        </div>
      </div>

      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-3 alert alert-warning mb-0"
        >
          <AlertCircle size={15} className="me-2" />
          {apiError}
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          {result.ok ? (
            <div>
              <h2 className="h5 fw-bold text-center text-dark mb-3">{t("servicesAccordes")}</h2>
              <div className="position-relative mx-auto" style={{ maxWidth: 420 }}>
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 overflow-visible"
                  style={{ zIndex: 0, pointerEvents: "none" }}
                  aria-hidden
                >
                  <span className="position-absolute rounded-1" style={{ width: 6, height: 6, top: "8%", left: "3%", background: "#7ec8e3", opacity: 0.6 }} />
                  <span className="position-absolute rounded-1" style={{ width: 5, height: 5, top: "18%", right: "6%", background: "#e8d35c", opacity: 0.65 }} />
                  <span className="position-absolute rounded-1" style={{ width: 4, height: 8, top: "5%", right: "18%", background: "#e07a63", opacity: 0.5, transform: "rotate(12deg)" }} />
                  <span className="position-absolute rounded-circle" style={{ width: 4, height: 4, bottom: "12%", left: "8%", background: "var(--sehily-vert-pro)", opacity: 0.45 }} />
                  <span className="position-absolute rounded-1" style={{ width: 6, height: 4, bottom: "20%", right: "10%", background: "#7ec8e3", opacity: 0.55 }} />
                </div>
                <div
                  className="position-relative text-center p-4 p-md-5 rounded-4 bg-white"
                  style={{
                    zIndex: 1,
                    border: "2px solid var(--sehily-vert-pro)",
                    boxShadow: "0 4px 24px rgba(15, 79, 76, 0.08)",
                  }}
                >
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 72,
                      height: 72,
                      background: "color-mix(in srgb, var(--sehily-creme) 40%, #e8e8e8)",
                    }}
                  >
                    <Banknote size={36} strokeWidth={1.5} style={{ color: "var(--sehily-vert-pro)" }} aria-hidden />
                  </div>
                  <p
                    className="text-uppercase fw-bold mb-3"
                    style={{ color: "var(--sehily-text)", letterSpacing: "0.04em", fontSize: "0.95rem" }}
                  >
                    {t("eligibleScholarshipTitle")}
                  </p>
                  {result.i18nKey ? (
                    <p className="small text-muted mb-3 mb-md-4">{t(result.i18nKey, result.i18nParams || {})}</p>
                  ) : null}
                  <div
                    className="d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 border small fw-semibold"
                    style={{
                      color: "var(--sehily-vert-pro)",
                      background: "color-mix(in srgb, var(--sehily-vert-pro) 8%, #fff)",
                      border: "1px solid color-mix(in srgb, var(--sehily-vert-pro) 45%, #c8d9d5)",
                    }}
                  >
                    <span
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{ width: 20, height: 20, background: "var(--sehily-vert-pro)", color: "#fff" }}
                    >
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </span>
                    {t("serviceAccorde")}
                  </div>
                  <div className="mt-4">
                    <Link className="btn sehily-btn-primary px-4" to="/auth/register?from=eligibilite">
                      {t("continueRegister")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 sehily-surface">
              <div className="fw-bold text-danger mb-2 d-flex align-items-center gap-2">
                <AlertCircle size={17} /> {t("eligibleNo")}
              </div>
              <div className="text-muted">
                {t(result.i18nKey, result.i18nParams || {})}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
