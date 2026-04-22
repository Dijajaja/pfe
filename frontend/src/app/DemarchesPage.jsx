import demarches from "../assets/demarches.png";

export function DemarchesPage() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Démarches (dépôt)</h1>
        <div className="text-muted">Illustration du parcours étudiant.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <img src={demarches} alt="Démarches" className="img-fluid rounded-3" />
        </div>
      </div>
    </div>
  );
}

