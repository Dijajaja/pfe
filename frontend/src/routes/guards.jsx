import { Navigate, Outlet, useLocation } from "react-router-dom";

import { tokenStore } from "../lib/api";

export function RequireAuth() {
  const location = useLocation();
  const tokens = tokenStore.get();
  if (!tokens?.access) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

