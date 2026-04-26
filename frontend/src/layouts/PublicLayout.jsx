import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logoWeb from "../assets/logo-web.png";
import { setLanguage } from "../i18n/setup";
import { FallbackBanner } from "../components/ui/FallbackBanner";

export function PublicLayout() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className={isLanding ? "" : "container py-3 py-lg-4"}>
      {!isLanding && (
        <header className="public-header d-flex align-items-center justify-content-between mb-4">
          <Link to="/" className="d-flex align-items-center gap-3 text-decoration-none">
            <img src={logoWeb} alt="SEHILY" style={{ height: 44 }} />
          </Link>

          <nav className="public-nav d-none d-lg-flex align-items-center gap-3">
            <Link to="/" className="public-nav-link public-nav-link--active">Accueil</Link>
            <a href="/#about" className="public-nav-link">À propos</a>
            <a href="/#how-it-works" className="public-nav-link">Comment ça marche</a>
            <a href="/#faq" className="public-nav-link">FAQ</a>
            <a href="/#contact" className="public-nav-link">Contact</a>
          </nav>

          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <div className="btn-group" role="group" aria-label="language">
              <button
                type="button"
                className={`btn btn-sm ${i18n.language === "fr" ? "btn-light" : "btn-outline-secondary"}`}
                onClick={() => setLanguage("fr")}
              >
                FR
              </button>
              <button
                type="button"
                className={`btn btn-sm ${i18n.language === "ar" ? "btn-light" : "btn-outline-secondary"}`}
                onClick={() => setLanguage("ar")}
              >
                AR
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={isLanding ? "" : "public-main"}>
        {!isLanding && <FallbackBanner />}
        <Outlet />
      </div>
    </div>
  );
}

