import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

import { fetchMe, login } from "../../app/auth";
import { getHomePathForRole, normalizeRole } from "../../app/session";
import { getApiErrorMessage } from "../../lib/apiError";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      try {
        const me = await fetchMe();
        const role = normalizeRole(me?.role);
        navigate(getHomePathForRole(role), { replace: true });
      } catch {
        // Fallback sûr si le profil n'est pas encore disponible.
        navigate("/app", { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Identifiants incorrects ou serveur indisponible."));
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
              <ShieldCheck size={14} />
              {t("loginChip")}
            </span>
            <h1 className="login-pro-title mt-3">
              {t("loginHeroTitlePrefix")} <span>{t("loginHeroTitleAccent")}</span>.
            </h1>
            <p className="login-pro-lead">
              {t("loginHeroLead")}
            </p>
            <ul className="login-pro-list">
              <li><CheckCircle2 size={18} /> {t("loginBenefit1")}</li>
              <li><CheckCircle2 size={18} /> {t("loginBenefit2")}</li>
              <li><CheckCircle2 size={18} /> {t("loginBenefit3")}</li>
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
            <h2 className="login-pro-card-title text-center">{t("login")}</h2>
            <p className="text-muted mb-4 text-center">{t("loginWelcomeBack")}</p>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <form onSubmit={onSubmit} className="d-grid gap-3">
              <div>
                <label className="form-label fw-semibold">{t("email")}</label>
                <div className="login-pro-input-wrap">
                  <Mail size={18} className="login-pro-input-icon" />
                  <input
                    className="form-control login-pro-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@example.mr"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">{t("password")}</label>
                  <Link className="login-pro-forgot" to="/auth/reset">
                    {t("loginForgot")}
                  </Link>
                </div>
                <div className="login-pro-input-wrap">
                  <Lock size={18} className="login-pro-input-icon" />
                  <input
                    className="form-control login-pro-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="login-pro-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mt-1">
                <label className="login-pro-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t("loginRememberMe")}</span>
                </label>
              </div>

              <button className="btn login-pro-submit" disabled={loading}>
                {loading ? t("loginLoading") : t("ctaLogin")} <ArrowRight size={18} />
              </button>

              <div className="text-center small text-muted mt-1">
                {t("loginCheckStatus")}{" "}
                <Link className="login-pro-register" to="/eligibilite">
                  {t("ctaCheck")}
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

