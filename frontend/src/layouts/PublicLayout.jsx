import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logoWeb from "../assets/logo-web.png";
import { setLanguage } from "../i18n/setup";
import { FallbackBanner } from "../components/ui/FallbackBanner";

export function PublicLayout() {
  const { t, i18n } = useTranslation();

  return (
    <div className="container py-4">
      <header className="d-flex align-items-center justify-content-between mb-4">
        <Link to="/" className="d-flex align-items-center gap-3 text-decoration-none">
          <img src={logoWeb} alt="SEHILY" style={{ height: 44 }} />
        </Link>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">{t("language")}</span>
          <div className="btn-group" role="group" aria-label="language">
            <button
              type="button"
              className={`btn btn-sm ${i18n.language === "fr" ? "btn-light" : "btn-outline-light"}`}
              onClick={() => setLanguage("fr")}
            >
              FR
            </button>
            <button
              type="button"
              className={`btn btn-sm ${i18n.language === "ar" ? "btn-light" : "btn-outline-light"}`}
              onClick={() => setLanguage("ar")}
            >
              AR
            </button>
          </div>
        </div>
      </header>

      <div className="sehily-surface p-4">
        <FallbackBanner />
        <Outlet />
      </div>

      <footer className="mt-4 text-center text-muted small">
        {t("appName")} — {t("tagline")}
      </footer>
    </div>
  );
}

