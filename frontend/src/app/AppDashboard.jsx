import logo from "../assets/logo-web.png";

export function AppDashboard() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="h4 mb-1">Tableau de bord</h1>
            <div className="text-muted">Espace connecté (squelette Personne 1).</div>
          </div>
          <img src={logo} alt="SEHILY" style={{ height: 38 }} />
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Actions</div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn sehily-btn-primary">Soumettre</button>
            <button className="btn sehily-btn-secondary">Annuler</button>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Statuts (UI)</div>
          <div className="d-flex gap-2 flex-wrap">
            <span className="sehily-badge sehily-badge--ok">Éligible</span>
            <span className="sehily-badge sehily-badge--danger">Rejeté</span>
            <span className="sehily-badge sehily-badge--warn">En attente</span>
          </div>
        </div>
      </div>
    </div>
  );
}

