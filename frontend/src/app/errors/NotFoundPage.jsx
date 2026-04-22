import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="text-center py-4">
      <h1 className="h3 mb-2">404 — Page introuvable</h1>
      <p className="text-muted mb-3">La route demandée n’existe pas dans l’application.</p>
      <div className="d-flex justify-content-center gap-2">
        <Link to="/" className="btn sehily-btn-secondary">
          Accueil
        </Link>
        <Link to="/app" className="btn sehily-btn-primary">
          Espace app
        </Link>
      </div>
    </div>
  );
}

