import { Navigate } from "react-router-dom";

import { getHomePathForRole, useEffectiveRole } from "../session";
import { tokenStore } from "../../lib/api";

/**
 * Plus d’écran 403 bloquant : on renvoie vers l’espace du rôle (ou l’accueil / login).
 * L’URL /403 reste valide mais ne sert plus de page d’erreur statique pour les comptes connectés.
 */
export function ForbiddenPage() {
  const { role, isLoading } = useEffectiveRole();
  const hasSession = !!tokenStore.get()?.access;

  if (hasSession && isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Redirection…
      </div>
    );
  }

  if (hasSession && role) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  if (hasSession) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Navigate to="/" replace />;
}
