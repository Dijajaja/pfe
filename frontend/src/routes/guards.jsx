import { Navigate, Outlet, useLocation } from "react-router-dom";

import { tokenStore } from "../lib/api";
import { useEffectiveRole } from "../app/session";

export function RequireAuth() {
  const location = useLocation();
  const tokens = tokenStore.get();
  if (!tokens?.access) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireRole({ allow }) {
  const { role, isLoading } = useEffectiveRole();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Chargement du profil...
      </div>
    );
  }

  if (!allow.includes(role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}

