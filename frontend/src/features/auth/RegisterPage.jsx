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
    <div className="login-pro-page login-pro-shell">
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
              Inscription sécurisée
            </span>
            <h1 className="login-pro-title mt-3">
              Créez votre compte <span>étudiant</span>.
            </h1>
            <p className="login-pro-lead">
              Complétez vos informations académiques pour accéder à votre espace personnel et suivre votre dossier en toute simplicité.
            </p>
            <ul className="login-pro-list">
              <li><CheckCircle2 size={18} /> Inscription guidée et rapide</li>
              <li><CheckCircle2 size={18} /> Établissements et filières structurés</li>
              <li><CheckCircle2 size={18} /> Parcours académique mieux organisé</li>
            </ul>
            <div className="login-pro-metrics mt-4">
              <span>Traitement rapide</span>
              <span>Flux sécurisé</span>
              <span>Assistance continue</span>
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
                <label className="form-label fw-semibold">{t("fieldFiliere")}</label>
                <div className="login-pro-input-wrap">
                  <GraduationCap size={18} className="login-pro-input-icon" />
                  <select
                    className="form-select login-pro-input"
                    value={form.filiere}
                    onChange={(e) => setField("filiere", e.target.value)}
                    required
                    aria-describedby="register-filiere-hint"
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
                <div id="register-filiere-hint" className="form-text">
                  {t("registerFiliereHint")}
                </div>
              </div>

              <div className="col-12 d-flex flex-wrap gap-2">
                <button className="btn login-pro-submit" disabled={loading}>
                  {loading ? "Inscription..." : t("register")} <ArrowRight size={18} />
                </button>
                <Link className="btn sehily-btn-secondary" to="/auth/login">
                  Se connecter
                </Link>
              </div>
              <div className="col-12 text-center small text-muted mt-1">
                Déjà un compte ?{" "}
                <Link className="login-pro-register" to="/auth/login">
                  Se connecter
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

