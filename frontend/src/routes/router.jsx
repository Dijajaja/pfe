import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { HomePage } from "../app/HomePage";
import { EligibilitePage } from "../app/EligibilitePage";
import { AppDashboard } from "../app/AppDashboard";
import { PalettePage } from "../app/PalettePage";
import { DemarchesPage } from "../app/DemarchesPage";
import { GuidePfePage } from "../app/GuidePfePage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { RequireAuth } from "./guards";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/eligibilite", element: <EligibilitePage /> },
      {
        path: "/auth",
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "reset", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <AppDashboard /> },
          { path: "palette", element: <PalettePage /> },
          { path: "demarches", element: <DemarchesPage /> },
          { path: "guide-pfe", element: <GuidePfePage /> },
        ],
      },
    ],
  },
]);

