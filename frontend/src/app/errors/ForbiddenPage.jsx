import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="text-center py-4">
      <h1 className="h3 mb-2">403 — Accès interdit</h1>
      <p className="text-muted mb-3">Ton rôle actuel n’a pas la permission d’accéder à cette page.</p>
      <Link to="/app" className="btn sehily-btn-primary">
        Retour à l’espace app
      </Link>
    </div>
  );
}

