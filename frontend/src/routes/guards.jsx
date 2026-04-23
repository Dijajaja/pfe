import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ensureValidAccessToken, tokenStore } from "../lib/api";
import { useEffectiveRole } from "../app/session";

export function RequireAuth() {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      const tokens = tokenStore.get();
      if (!tokens?.access && !tokens?.refresh) {
        if (active) {
          setIsAllowed(false);
          setIsChecking(false);
        }
        return;
      }
      try {
        await ensureValidAccessToken();
        if (active) {
          setIsAllowed(true);
          setIsChecking(false);
        }
      } catch {
        tokenStore.clear();
        if (active) {
          setIsAllowed(false);
          setIsChecking(false);
        }
      }
    }
    checkSession();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (isChecking) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Vérification de la session...
      </div>
    );
  }

  if (!isAllowed) {
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

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}

