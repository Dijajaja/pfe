import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Hash, Lock, Mail, UserPlus } from "lucide-react";

import { authApi } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { ETABLISSEMENTS_MAURITANIE, getFilieresPourEtablissement } from "../../data/mauritanieUniversite";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    matricule: "",
    etablissement: "",
    filiere: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filieresPourEtablissement = useMemo(
    () => getFilieresPourEtablissement(form.etablissement),
    [form.etablissement]
  );

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setEtablissement(value) {
    setForm((f) => {
      if (!value) {
        return { ...f, etablissement: "", filiere: "" };
      }
      const filieres = getFilieresPourEtablissement(value);
      const allowed = new Set(filieres.map((x) => x.value));
      const filiere = f.filiere && allowed.has(f.filiere) ? f.filiere : "";
      return { ...f, etablissement: value, filiere };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, t("registerErrorGeneric")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-pro-page login-pro-shell public-modern">
      <div className="login-pro-frame p-3 p-lg-4">
        <div className="row g-4 align-items-stretch">
        <div className="col-12 col-lg-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="login-pro-marketing login-pro-marketing-card h-100"
          >
            <span className="login-pro-chip">
              <UserPlus size={14} />
              {t("registerChip")}
            </span>
            <h1 className="login-pro-title mt-3">
              {t("registerHeroTitlePrefix")} <span>{t("registerHeroTitleAccent")}</span>.
            </h1>
            <p className="login-pro-lead">
              {t("registerHeroLead")}
            </p>
            <ul className="login-pro-list">
              <li><CheckCircle2 size={18} /> {t("registerBenefit1")}</li>
              <li><CheckCircle2 size={18} /> {t("registerBenefit2")}</li>
              <li><CheckCircle2 size={18} /> {t("registerBenefit3")}</li>
            </ul>
            <div className="login-pro-metrics mt-4">
              <span>{t("loginMetric1")}</span>
              <span>{t("loginMetric2")}</span>
              <span>{t("loginMetric3")}</span>
            </div>
          </motion.div>
        </div>

        <div className="col-12 col-lg-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="login-pro-card"
          >
            <h2 className="login-pro-card-title">{t("register")}</h2>
            <p className="text-muted mb-4">{t("registerLead")}</p>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <form onSubmit={onSubmit} className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("email")}</label>
                <div className="login-pro-input-wrap">
                  <Mail size={18} className="login-pro-input-icon" />
                  <input
                    className="form-control login-pro-input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="nom@example.mr"
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t("password")}</label>
                <div className="login-pro-input-wrap">
                  <Lock size={18} className="login-pro-input-icon" />
                  <input
                    className="form-control login-pro-input"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    required
                    minLength={8}
                    placeholder="Au moins 8 caractères"
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t("fieldMatricule")}</label>
                <div className="login-pro-input-wrap">
                  <Hash size={18} className="login-pro-input-icon" />
                  <input
                    className="form-control login-pro-input"
                    autoComplete="off"
                    value={form.matricule}
                    onChange={(e) => setField("matricule", e.target.value)}
                    placeholder="Ex: 23A1234"
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t("fieldEtablissement")}</label>
                <div className="login-pro-input-wrap">
                  <Building2 size={18} className="login-pro-input-icon" />
                  <select
                    className="form-select login-pro-input"
                    value={form.etablissement}
                    onChange={(e) => setEtablissement(e.target.value)}
                    required
                  >
                    <option value="">{t("selectPlaceholder")}</option>
                    {ETABLISSEMENTS_MAURITANIE.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="register-filiere">
                  {t("fieldFiliere")}
                </label>
                <div className="login-pro-input-wrap">
                  <GraduationCap size={18} className="login-pro-input-icon" />
                  <select
                    id="register-filiere"
                    className="form-select login-pro-input"
                    value={form.filiere}
                    onChange={(e) => setField("filiere", e.target.value)}
                    required
                  >
                    {!form.etablissement ? (
                      <option value="">{t("selectEtablissementFirstFiliere")}</option>
                    ) : (
                      <>
                        <option value="">{t("selectPlaceholder")}</option>
                        {filieresPourEtablissement.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="col-12 d-flex flex-wrap gap-2">
                <button className="btn login-pro-submit" disabled={loading}>
                  {loading ? t("registerLoading") : t("register")} <ArrowRight size={18} />
                </button>
                <Link className="btn sehily-btn-secondary" to="/auth/login">
                  {t("ctaLogin")}
                </Link>
              </div>
              <div className="col-12 text-center small text-muted mt-1">
                {t("registerAlreadyAccount")}{" "}
                <Link className="login-pro-register" to="/auth/login">
                  {t("ctaLogin")}
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
        </div>
      </div>
    </div>
  );
}

