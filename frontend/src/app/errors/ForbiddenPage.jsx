import { Link } from "react-router-dom";

import { useEffectiveRole } from "../session";

export function ForbiddenPage() {
  const { role } = useEffectiveRole();

  const backToApp =
    role === "ADMIN"
      ? "/app/admin/dashboard"
      : role === "PARTENAIRE"
        ? "/app/partner/dashboard"
        : role === "ETUDIANT"
          ? "/app/student/dashboard"
          : "/app";

  return (
    <div className="text-center py-4">
      <h1 className="h3 mb-2">403 — Accès interdit</h1>
      <p className="text-muted mb-3">Ton rôle actuel n’a pas la permission d’accéder à cette page.</p>
      <Link to={backToApp} className="btn sehily-btn-primary">
        Retour à l’espace app
      </Link>
    </div>
  );
}

