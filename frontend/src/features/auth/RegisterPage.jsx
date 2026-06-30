import { useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, Phone, UserPlus } from "lucide-react";

import { authApi } from "../../lib/api";
import { login } from "../../app/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import { canRegisterFromEligibility, clearEligibilityRef, loadEligibilityRef } from "../../lib/eligibilityGate";
import { vEmail, vTelephone, vPassword, vPasswordConfirm, inputState } from "../../lib/validators";

function ValidationHint({ touched, result }) {
  if (!touched || !result) return null;
  return (
    <div className={`small mt-1 d-flex align-items-center gap-1 ${result.valid ? "text-success" : "text-danger"}`}>
      {result.valid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {result.msg}
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const eligibilityRef = useMemo(() => loadEligibilityRef(), []);
  // Flag pour empêcher le guard d'éligibilité de court-circuiter la redirection post-inscription.
  const redirectingRef = useRef(false);

  const [form, setForm] = useState({
    email: "",
    telephone: "",
    password: "",
    password_confirm: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    telephone: false,
    password: false,
    password_confirm: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailV    = vEmail(form.email);
  const telV      = vTelephone(form.telephone);
  const pwdV      = vPassword(form.password);
  const pwdCfmV   = vPasswordConfirm(form.password_confirm, form.password);
  const formValid = emailV.valid && telV.valid && pwdV.valid && pwdCfmV.valid;

  function touch(key) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  if (!redirectingRef.current && !canRegisterFromEligibility()) {
    return <Navigate to="/eligibilite" replace />;
  }

  const etudiant = eligibilityRef.etudiant;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, telephone: true, password: true, password_confirm: true });
    setError("");
    if (!formValid) return;
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        telephone: form.telephone,
        nni: etudiant.nni,
        matricule: etudiant.matricule,
      });
      await login(form.email, form.password);
      redirectingRef.current = true;
      clearEligibilityRef();
      navigate("/app/student/dashboard", { replace: true });
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
              className="login-pro-marketing login-pro-marketing-card h-100"
            >
              <span className="login-pro-chip">
                <UserPlus size={14} />
                {t("registerChip")}
              </span>
              <h1 className="login-pro-title mt-3">
                {t("registerHeroTitlePrefix")} <span>{t("registerHeroTitleAccent")}</span>.
              </h1>
              <p className="login-pro-lead">{t("registerHeroLead")}</p>
            </motion.div>
          </div>

          <div className="col-12 col-lg-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="login-pro-card">
              <h2 className="login-pro-card-title text-center">{t("register")}</h2>
              <p className="text-muted mb-4 text-center">Éligibilité confirmée — complétez votre compte.</p>

              {error ? <div className="alert alert-danger">{error}</div> : null}

              <div className="p-3 rounded-4 mb-4" style={{ background: "#f0f7f4" }}>
                <div className="small fw-bold mb-2 d-flex align-items-center gap-2">
                  <CheckCircle2 size={16} /> Données CNOU (lecture seule)
                </div>
                <div className="row g-2 small">
                  <div className="col-12"><strong>Nom :</strong> {etudiant.nom_complet}</div>
                  <div className="col-12"><strong>Wilaya :</strong> {etudiant.wilaya}</div>
                  <div className="col-12"><strong>Établissement :</strong> {etudiant.etablissement}</div>
                  <div className="col-12"><strong>Formation :</strong> {etudiant.formation}</div>
                  <div className="col-12"><strong>Année :</strong> {etudiant.annee_courante}</div>
                  <div className="col-12"><strong>Matricule :</strong> {etudiant.matricule}</div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">{t("email")}</label>
                  <div className="login-pro-input-wrap">
                    <Mail size={18} className="login-pro-input-icon" />
                    <input
                      className={`form-control login-pro-input ${inputState(touched.email, emailV.valid)}`}
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => { setField("email", e.target.value); touch("email"); }}
                      onBlur={() => touch("email")}
                    />
                  </div>
                  <ValidationHint touched={touched.email} result={emailV} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Téléphone</label>
                  <div className="login-pro-input-wrap">
                    <Phone size={18} className="login-pro-input-icon" />
                    <input
                      className={`form-control login-pro-input ${inputState(touched.telephone, telV.valid)}`}
                      type="tel"
                      autoComplete="tel"
                      value={form.telephone}
                      onChange={(e) => { setField("telephone", e.target.value); touch("telephone"); }}
                      onBlur={() => touch("telephone")}
                      placeholder="Ex: 41234567"
                    />
                  </div>
                  <ValidationHint touched={touched.telephone} result={telV} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">{t("password")}</label>
                  <div className="login-pro-input-wrap">
                    <Lock size={18} className="login-pro-input-icon" />
                    <input
                      className={`form-control login-pro-input ${inputState(touched.password, pwdV.valid)}`}
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => { setField("password", e.target.value); touch("password"); }}
                      onBlur={() => touch("password")}
                    />
                  </div>
                  <ValidationHint touched={touched.password} result={pwdV} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Confirmer le mot de passe</label>
                  <div className="login-pro-input-wrap">
                    <Lock size={18} className="login-pro-input-icon" />
                    <input
                      className={`form-control login-pro-input ${inputState(touched.password_confirm, pwdCfmV.valid)}`}
                      type="password"
                      autoComplete="new-password"
                      value={form.password_confirm}
                      onChange={(e) => { setField("password_confirm", e.target.value); touch("password_confirm"); }}
                      onBlur={() => touch("password_confirm")}
                    />
                  </div>
                  <ValidationHint touched={touched.password_confirm} result={pwdCfmV} />
                </div>
                <div className="col-12">
                  <button className="btn login-pro-submit w-100" disabled={loading}>
                    {loading ? t("registerLoading") : t("register")} <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
