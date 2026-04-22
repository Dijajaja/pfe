import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "../../lib/api";

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

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError("Inscription impossible. Vérifie les champs ou l’e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-10 col-lg-7">
        <h2 className="mb-1">{t("register")}</h2>
        <p className="text-muted">Crée ton compte étudiant.</p>

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
            <label className="form-label">Matricule</label>
            <input
              className="form-control"
              value={form.matricule}
              onChange={(e) => setField("matricule", e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Établissement</label>
            <input
              className="form-control"
              value={form.etablissement}
              onChange={(e) => setField("etablissement", e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Filière</label>
            <input
              className="form-control"
              value={form.filiere}
              onChange={(e) => setField("filiere", e.target.value)}
              required
            />
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

