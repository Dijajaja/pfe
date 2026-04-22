import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { evaluerEligibilite } from "../lib/eligibilite";

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

  const age = useMemo(() => (dateNaissance ? calcAgeYears(dateNaissance) : null), [dateNaissance]);

  function onSubmit(e) {
    e.preventDefault();
    setResult(
      evaluerEligibilite({
        nni,
        dateNaissance,
        wilayaBac: wilaya,
        niveau,
      })
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">{t("eligibilityTitle")}</h1>
          <p className="text-muted mb-0">{t("eligibilitySubtitle")}</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/">
          {t("backHome")}
        </Link>
      </div>

      <form className="row g-3" onSubmit={onSubmit}>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="nni">
            {t("fieldNni")}
          </label>
          <input
            id="nni"
            className="form-control"
            value={nni}
            onChange={(e) => setNni(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="dob">
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
          {age !== null && (
            <div className="form-text">
              {t("computedAge", { age })}
            </div>
          )}
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="wilaya">
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
          <label className="form-label" htmlFor="niveau">
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

        <div className="col-12 d-flex gap-2">
          <button className="btn sehily-btn-primary" type="submit">
            {t("checkEligibility")}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 p-3 sehily-surface">
          {result.ok ? (
            <div>
              <div className="fw-bold text-success mb-2">{t("eligibleYes")}</div>
              <div className="text-muted mb-3">
                {t(result.i18nKey, result.i18nParams || {})}
              </div>
              <Link className="btn sehily-btn-primary" to="/auth/register?from=eligibilite">
                {t("continueRegister")}
              </Link>
            </div>
          ) : (
            <div>
              <div className="fw-bold text-danger mb-2">{t("eligibleNo")}</div>
              <div className="text-muted">
                {t(result.i18nKey, result.i18nParams || {})}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-muted small mt-3 mb-0">
        {t("eligibilityNote")}
      </p>
    </div>
  );
}
