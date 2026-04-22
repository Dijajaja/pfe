import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import appIcon from "../assets/app-icon.png";
import { logout } from "../app/auth";

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="container-fluid py-3">
      <div className="row g-3">
        <aside className="col-12 col-lg-3 col-xl-2">
          <div className="sehily-surface p-3">
            <Link to="/app" className="d-flex align-items-center gap-2 text-decoration-none mb-3">
              <img src={appIcon} alt="SEHILY" style={{ height: 38, width: 38, borderRadius: 12 }} />
              <div className="lh-sm">
                <div className="fw-bold">{t("appName")}</div>
                <div className="text-muted small">{t("welcome")}</div>
              </div>
            </Link>

            <nav className="nav nav-pills flex-column gap-2">
              <NavLink className="nav-link" to="/app">
                Tableau de bord
              </NavLink>
              <NavLink className="nav-link" to="/app/palette">
                Palette
              </NavLink>
              <NavLink className="nav-link" to="/app/demarches">
                Démarches
              </NavLink>
              <NavLink className="nav-link" to="/app/guide-pfe">
                Guide PFE
              </NavLink>
            </nav>

            <hr className="border-opacity-25" />
            <button className="btn sehily-btn-secondary w-100" onClick={() => logout()}>
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="col-12 col-lg-9 col-xl-10">
          <div className="sehily-surface p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

