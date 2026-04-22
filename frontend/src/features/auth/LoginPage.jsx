import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { login } from "../../app/auth";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError("Identifiants incorrects ou serveur indisponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-5">
        <h2 className="mb-1">{t("login")}</h2>
        <p className="text-muted">{t("tagline")}</p>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form onSubmit={onSubmit} className="d-grid gap-3">
          <div>
            <label className="form-label">{t("email")}</label>
            <input
              className="form-control"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">{t("password")}</label>
            <input
              className="form-control"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button className="btn sehily-btn-primary" disabled={loading}>
            {loading ? "..." : t("submit")}
          </button>

          <div className="d-flex justify-content-between small">
            <Link className="sehily-link" to="/auth/reset">
              {t("resetPassword")}
            </Link>
            <Link className="sehily-link" to="/auth/register">
              {t("register")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

