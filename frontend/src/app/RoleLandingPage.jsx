import { Navigate } from "react-router-dom";

import { useEffectiveRole } from "./session";

export function RoleLandingPage() {
  const { role } = useEffectiveRole();
  if (role === "ADMIN") return <Navigate to="/app/admin/dashboard" replace />;
  if (role === "PARTENAIRE") return <Navigate to="/app/partner/batches" replace />;
  return <Navigate to="/app/student/dashboard" replace />;
}

