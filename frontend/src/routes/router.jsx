import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { HomePage } from "../app/HomePage";
import { EligibilitePage } from "../app/EligibilitePage";
import { DemarchesPage } from "../app/DemarchesPage";
import { GuidePfePage } from "../app/GuidePfePage";
import { RoleLandingPage } from "../app/RoleLandingPage";
import { StudentDashboardPage } from "../features/student/StudentDashboardPage";
import { StudentDossierPage } from "../features/student/StudentDossierPage";
import { StudentSuiviPage } from "../features/student/StudentSuiviPage";
import { StudentPaiementsPage } from "../features/student/StudentPaiementsPage";
import { StudentNotificationsPage } from "../features/student/StudentNotificationsPage";
import { AdminDashboardPage } from "../features/admin/AdminDashboardPage";
import { AdminDossiersPage } from "../features/admin/AdminDossiersPage";
import { AdminUsersPage } from "../features/admin/AdminUsersPage";
import { AdminExportsPage } from "../features/admin/AdminExportsPage";
import { PartnerBatchesPage } from "../features/partner/PartnerBatchesPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { RequireAuth, RequireRole } from "./guards";
import { ForbiddenPage } from "../app/errors/ForbiddenPage";
import { NotFoundPage } from "../app/errors/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/admin", element: <Navigate to="/app/admin/dashboard" replace /> },
  { path: "/admin/dossiers", element: <Navigate to="/app/admin/dossiers" replace /> },
  { path: "/admin/etudiants", element: <Navigate to="/app/admin/users" replace /> },
  { path: "/admin/exports", element: <Navigate to="/app/admin/exports" replace /> },
  { path: "/mauriposte", element: <Navigate to="/app/partner/batches" replace /> },
  { path: "/mauriposte/dashboard", element: <Navigate to="/app/partner/batches" replace /> },
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/eligibilite", element: <EligibilitePage /> },
      { path: "/403", element: <ForbiddenPage /> },
      {
        path: "/auth",
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "reset", element: <ResetPasswordPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <RoleLandingPage /> },
          { path: "demarches", element: <DemarchesPage /> },
          { path: "guide-pfe", element: <GuidePfePage /> },
          {
            path: "student",
            element: <RequireRole allow={["ETUDIANT"]} />,
            children: [
              { path: "dashboard", element: <StudentDashboardPage /> },
              { path: "dossier", element: <StudentDossierPage /> },
              { path: "suivi", element: <StudentSuiviPage /> },
              { path: "paiements", element: <StudentPaiementsPage /> },
              { path: "notifications", element: <StudentNotificationsPage /> },
            ],
          },
          {
            path: "admin",
            element: <RequireRole allow={["ADMIN"]} />,
            children: [
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "dossiers", element: <AdminDossiersPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "exports", element: <AdminExportsPage /> },
            ],
          },
          {
            path: "partner",
            element: <RequireRole allow={["PARTENAIRE"]} />,
            children: [{ path: "batches", element: <PartnerBatchesPage /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

