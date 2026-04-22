import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import appIcon from "../assets/app-icon.png";
import { logout } from "../app/auth";
import { useEffectiveRole } from "../app/session";
import { FallbackBanner } from "../components/ui/FallbackBanner";

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, user } = useEffectiveRole();

  function onLogout() {
    logout();
    navigate("/auth/login", { replace: true });
  }

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Utilisateur";

  const roleBadge =
    role === "ADMIN"
      ? "Admin CNOU"
      : role === "PARTENAIRE"
        ? "Partenaire"
        : "Étudiant";

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

            <div className="mb-3 p-2 border rounded-3">
              <div className="small text-muted">Session</div>
              {role === "ADMIN" ? (
                <div className="small">
                  <span className="fw-semibold">Admin CNOU connecté :</span> {displayName}
                </div>
              ) : (
                <div className="small">
                  <span className="fw-semibold">Utilisateur connecté :</span> {displayName}
                </div>
              )}
              <span className="sehily-badge sehily-badge--ok mt-2">{roleBadge}</span>
            </div>

            <nav className="nav nav-pills flex-column gap-2">
              {role === "ETUDIANT" ? (
                <>
                  <NavLink className="nav-link" to="/app/student/dashboard">
                    Dashboard étudiant
                  </NavLink>
                  <NavLink className="nav-link" to="/app/student/dossier">
                    Dossier & documents
                  </NavLink>
                  <NavLink className="nav-link" to="/app/student/suivi">
                    Suivi statuts
                  </NavLink>
                  <NavLink className="nav-link" to="/app/student/paiements">
                    Paiements
                  </NavLink>
                  <NavLink className="nav-link" to="/app/student/notifications">
                    Notifications
                  </NavLink>
                </>
              ) : null}

              {role === "ADMIN" ? (
                <>
                  <NavLink className="nav-link" to="/app/admin/dashboard">
                    Dashboard admin
                  </NavLink>
                  <NavLink className="nav-link" to="/app/admin/dossiers">
                    Dossiers
                  </NavLink>
                  <NavLink className="nav-link" to="/app/admin/users">
                    Utilisateurs
                  </NavLink>
                  <NavLink className="nav-link" to="/app/admin/exports">
                    Exports
                  </NavLink>
                </>
              ) : null}

              {role === "PARTENAIRE" ? (
                <NavLink className="nav-link" to="/app/partner/batches">
                  Listes bénéficiaires
                </NavLink>
              ) : null}

            </nav>

            <hr className="border-opacity-25" />
            <button className="btn sehily-btn-secondary w-100" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="col-12 col-lg-9 col-xl-10">
          <div className="sehily-surface p-4">
            <FallbackBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

