import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

import { requestPasswordReset } from "../../app/auth";
import { getApiErrorMessage } from "../../lib/apiError";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t("resetPasswordErrorGeneric")));
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
                {t("resetPasswordHeroTitlePrefix")} <span>{t("resetPasswordHeroTitleAccent")}</span>
              </h1>
              <p className="login-pro-lead">{t("resetPasswordHeroLead")}</p>
              <ul className="login-pro-list">
                <li>
                  <CheckCircle2 size={18} /> {t("resetPasswordBenefit1")}
                </li>
                <li>
                  <CheckCircle2 size={18} /> {t("resetPasswordBenefit2")}
                </li>
                <li>
                  <CheckCircle2 size={18} /> {t("resetPasswordBenefit3")}
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="col-12 col-lg-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="login-pro-card"
            >
              <h2 className="login-pro-card-title text-center">{t("resetPassword")}</h2>
              <p className="text-muted mb-4 text-center">{t("resetPasswordLead")}</p>

              {success ? (
                <div className="d-grid gap-3">
                  <div className="alert alert-success mb-0" role="status">
                    <strong className="d-block mb-1">{t("resetPasswordSuccessTitle")}</strong>
                    {t("resetPasswordSuccessBody")}
                  </div>
                  <Link className="btn login-pro-submit text-center text-decoration-none" to="/auth/login">
                    <ArrowLeft size={18} className="me-1" style={{ verticalAlign: "text-bottom" }} />
                    {t("resetPasswordBackLogin")}
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="d-grid gap-3">
                  {error ? <div className="alert alert-danger">{error}</div> : null}

                  <div>
                    <label className="form-label fw-semibold" htmlFor="reset-email">
                      {t("email")}
                    </label>
                    <div className="login-pro-input-wrap">
                      <Mail size={18} className="login-pro-input-icon" />
                      <input
                        id="reset-email"
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

                  <p className="small text-muted mb-0">{t("resetPasswordHint")}</p>

                  <button type="submit" className="btn login-pro-submit" disabled={loading}>
                    {loading ? t("resetPasswordSubmitting") : t("resetPasswordSubmit")}
                    {!loading ? <ArrowRight size={18} /> : null}
                  </button>

                  <div className="text-center">
                    <Link className="login-pro-register" to="/auth/login">
                      {t("resetPasswordBackLogin")}
                    </Link>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
