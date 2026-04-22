import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "../../lib/api";
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
      setError(t("registerErrorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-10 col-lg-7">
        <h2 className="mb-1">{t("register")}</h2>
        <p className="text-muted">{t("registerLead")}</p>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form onSubmit={onSubmit} className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">{t("email")}</label>
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">{t("password")}</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">{t("fieldMatricule")}</label>
            <input
              className="form-control"
              value={form.matricule}
              onChange={(e) => setField("matricule", e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">{t("fieldEtablissement")}</label>
            <select
              className="form-select"
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
          <div className="col-12 col-md-4">
            <label className="form-label">{t("fieldFiliere")}</label>
            <select
              className="form-select"
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
            <div id="register-filiere-hint" className="form-text">
              {t("registerFiliereHint")}
            </div>
          </div>

          <div className="col-12 d-flex gap-2">
            <button className="btn sehily-btn-primary" disabled={loading}>
              {loading ? "..." : t("submit")}
            </button>
            <Link className="btn sehily-btn-secondary" to="/auth/login">
              {t("cancel")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

