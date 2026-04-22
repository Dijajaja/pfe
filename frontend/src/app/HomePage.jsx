import demarches from "../assets/demarches.png";

export function HomePage() {
  return (
    <div className="row g-4">
      <div className="col-12 col-lg-6">
        <h1 className="h3 mb-2">Plateforme SEHILY</h1>
        <p className="text-muted mb-3">
          Dépôt de bourses simplifié : inscription, dépôt de dossier, validation, paiement.
        </p>

        <div className="d-flex gap-2 flex-wrap">
          <span className="sehily-badge sehily-badge--ok">Éligible</span>
          <span className="sehily-badge sehily-badge--danger">Rejeté</span>
          <span className="sehily-badge sehily-badge--warn">En attente</span>
        </div>

        <hr className="border-opacity-25" />

        <div className="d-flex gap-2">
          <a className="btn sehily-btn-primary" href="/auth/login">
            Se connecter
          </a>
          <a className="btn sehily-btn-secondary" href="/auth/register">
            Créer un compte
          </a>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="row g-3">
          <div className="col-12">
            <div className="sehily-surface p-3">
              <div className="fw-bold mb-2">Démarches</div>
              <img src={demarches} alt="Démarches dépôt" className="img-fluid rounded-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

