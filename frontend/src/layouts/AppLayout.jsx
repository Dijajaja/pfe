import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FiBell,
  FiBookOpen,
  FiClock,
  FiCheckSquare,
  FiFile,
  FiCreditCard,
  FiFileText,
  FiFolder,
  FiHome,
  FiLogOut,
  FiMail,
  FiMenu,
  FiSettings,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

import appIcon from "../assets/app-icon.png";
import mauripostLogo from "../assets/mauripost-logo.svg";
import { logout } from "../app/auth";
import { useEffectiveRole } from "../app/session";
import { FallbackBanner } from "../components/ui/FallbackBanner";
import { partnerApi } from "../features/api/webFeaturesApi";

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, user } = useEffectiveRole();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const partnerSummaryQuery = useQuery({
    queryKey: ["partner", "summary"],
    queryFn: () => partnerApi.listOperationalPaiements(),
    enabled: role === "PARTENAIRE",
    retry: false,
  });

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
        ? "Admin Mauripost"
        : "Étudiant";
  const roleSubtitle =
    role === "ADMIN" ? "Administrateur" : role === "PARTENAIRE" ? "Partenaire paiement" : "Espace étudiant";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const partnerPayments = partnerSummaryQuery.data || [];
  const partnerWaitingCount = partnerPayments.filter((p) => p.statut !== "EFFECTUE").length;
  const partnerNotifCount = Math.max(0, partnerWaitingCount + (partnerPayments.length ? 1 : 0));

  const studentLinks = [
    { to: "/app/student/dashboard", label: "Dashboard étudiant", icon: FiHome },
    { to: "/app/student/dossier", label: "Dossier & documents", icon: FiFolder },
    { to: "/app/student/suivi", label: "Suivi statuts", icon: FiCheckSquare },
    { to: "/app/student/paiements", label: "Paiements", icon: FiCreditCard },
    { to: "/app/student/notifications", label: "Notifications", icon: FiBell },
  ];

  const adminLinks = [
    { to: "/app/admin/dashboard", label: "Dashboard admin", icon: FiHome },
    { to: "/app/admin/dossiers", label: "Dossiers", icon: FiFolder },
    { to: "/app/admin/users", label: "Utilisateurs", icon: FiUsers },
    { to: "/app/admin/exports", label: "Exports", icon: FiFileText },
  ];

  const partnerLinks = [
    { to: "/app/partner/dashboard", label: "Tableau de bord", icon: FiHome },
    { to: "/app/partner/to-process", label: "Paiements à traiter", icon: FiClock, badge: partnerWaitingCount },
    { to: "/app/partner/completed", label: "Paiements effectués", icon: FiCheckSquare },
    { to: "/app/partner/history", label: "Historique", icon: FiBookOpen },
    { to: "/app/partner/reports", label: "Relevés / Rapports", icon: FiFile },
    { to: "/app/partner/notifications", label: "Notifications", icon: FiBell, badge: partnerNotifCount },
    { to: "/app/partner/settings", label: "Paramètres", icon: FiSettings },
  ];

  const notificationsPath =
    role === "ETUDIANT"
      ? "/app/student/notifications"
      : role === "PARTENAIRE"
        ? "/app/partner/notifications"
        : "/app/notifications-center";
  const messagesPath = "/app/messages-center";

  function onCloseSidebar() {
    setSidebarOpen(false);
  }

  function renderNavLinks(items) {
    return items.map(({ to, label, icon: Icon, badge }) => (
      <NavLink key={to} className="nav-link d-flex align-items-center gap-2" to={to} onClick={onCloseSidebar}>
        <Icon size={15} />
        <span>{label}</span>
        {typeof badge === "number" && badge > 0 ? <span className="app-nav-badge ms-auto">{badge}</span> : null}
      </NavLink>
    ));
  }

  function renderSidebar() {
    return (
      <div className="app-sidebar p-3 h-100 d-flex flex-column">
        <Link to="/app" className="d-flex align-items-center gap-2 text-decoration-none mb-4" onClick={onCloseSidebar}>
          <img src={appIcon} alt="SEHILY" style={{ height: 38, width: 38, borderRadius: 12, objectFit: "cover" }} />
          <div className="lh-sm text-white">
            <div className="fw-bold">{t("appName")}</div>
            <div className="small text-white-50">{t("welcome")}</div>
          </div>
        </Link>

        <div className="mb-3 app-sidebar-user">
          <div className="d-flex align-items-center gap-2">
            <span className="app-user-avatar">{initials || "U"}</span>
            <div>
              <div className="small text-white fw-semibold">{displayName}</div>
              <div className="small text-white-50">{roleSubtitle}</div>
            </div>
          </div>
          {role === "PARTENAIRE" ? (
            <div className="small text-white-50 mt-2 d-flex align-items-center gap-2">
              <span className="app-online-dot" />
              En ligne
            </div>
          ) : null}
          {role === "ADMIN" ? (
            <div className="small text-white-50 mt-2">Admin CNOU connecté</div>
          ) : (
            <div className="small text-white-50 mt-2">Utilisateur connecté</div>
          )}
          <span className="sehily-badge sehily-badge--ok mt-2 app-sidebar-badge">{roleBadge}</span>
        </div>

        <div className="app-sidebar-nav-wrap">
          <nav className="nav nav-pills flex-column gap-2 app-sidebar-nav">
            {role === "ETUDIANT" ? renderNavLinks(studentLinks) : null}
            {role === "ADMIN" ? renderNavLinks(adminLinks) : null}
            {role === "PARTENAIRE" ? renderNavLinks(partnerLinks) : null}
          </nav>
        </div>

        <div className="app-sidebar-footer">
          {role === "PARTENAIRE" ? (
            <div className="app-sidebar-help mt-3">
              <div className="fw-semibold small text-white">Besoin d'aide ?</div>
              <div className="small text-white-50 mb-2">Consultez la documentation ou contactez le support.</div>
              <button className="btn btn-sm sehily-btn-secondary w-100">Voir la documentation</button>
            </div>
          ) : null}

          <hr className="border-light border-opacity-25" />
          <button className="btn sehily-btn-secondary w-100 d-flex align-items-center justify-content-center gap-2" onClick={onLogout}>
            <FiLogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 app-shell">
      <div className="row g-3">
        <aside className="col-12 col-lg-3 col-xl-2 d-none d-lg-block">{renderSidebar()}</aside>

        <main className="col-12 col-lg-9 col-xl-10">
          <div className="sehily-surface p-3 mb-3 app-topbar">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-lg-6">
                <div className="app-topbar-search">
                  <FiSearch className="app-topbar-search-icon" size={15} />
                  <input className="form-control" placeholder="Rechercher (dossier, étudiant, etc)" />
                </div>
              </div>
              <div className="col-12 col-lg-6">
                <div className="d-flex justify-content-lg-end align-items-center gap-2">
                  <button className="btn btn-sm app-top-icon d-lg-none" type="button" aria-label="Ouvrir menu" onClick={() => setSidebarOpen(true)}>
                    <FiMenu size={15} />
                  </button>
                  <button className="btn btn-sm app-top-icon" type="button" aria-label="Notifications" onClick={() => navigate(notificationsPath)}>
                    <FiBell size={15} />
                  </button>
                  <button className="btn btn-sm app-top-icon" type="button" aria-label="Messages" onClick={() => navigate(messagesPath)}>
                    <FiMail size={15} />
                  </button>
                  <div className="app-top-profile">
                    {role === "PARTENAIRE" ? (
                      <img src={mauripostLogo} alt="Mauripost" className="app-top-profile-logo" />
                    ) : (
                      <span className="app-user-avatar app-user-avatar-sm">{initials || "U"}</span>
                    )}
                    <div className="lh-sm">
                      <div className="small fw-semibold">{displayName}</div>
                      <div className="small text-muted">{roleBadge}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sehily-surface p-4">
            <FallbackBanner />
            <Outlet />
          </div>
        </main>
      </div>

      <div className={`app-mobile-overlay d-lg-none ${isSidebarOpen ? "show" : ""}`} onClick={onCloseSidebar} />
      <aside className={`app-mobile-drawer d-lg-none ${isSidebarOpen ? "show" : ""}`}>
        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-sm app-top-icon" type="button" aria-label="Fermer menu" onClick={onCloseSidebar}>
            <FiX size={16} />
          </button>
        </div>
        {renderSidebar()}
      </aside>
    </div>
  );
}

