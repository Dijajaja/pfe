import { Navigate } from "react-router-dom";

import { useEffectiveRole } from "./session";

export function RoleLandingPage() {
  const { role, isLoading } = useEffectiveRole();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Chargement du profil…
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role === "ADMIN") return <Navigate to="/app/admin/dashboard" replace />;
  if (role === "PARTENAIRE") return <Navigate to="/app/partner/batches" replace />;
  return <Navigate to="/app/student/dashboard" replace />;
}

