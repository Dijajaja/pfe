export function MessagesCenterPage() {
  return (
    <div className="row g-3">
      <div className="col-12">
        <h1 className="h4 mb-1">Messagerie</h1>
        <div className="text-muted">Centre de messages interne.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="text-muted">
            Aucun message pour le moment. Les échanges apparaîtront ici dès activation du module de messagerie.
          </div>
        </div>
      </div>
    </div>
  );
}
