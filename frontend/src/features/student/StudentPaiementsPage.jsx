import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";

export function StudentPaiementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["student", "paiements"],
    queryFn: studentApi.listPaiements,
  });

  const rows = data || [];

  if (isLoading) return <div className="p-3">Chargement des paiements...</div>;
  if (error) return <div className="alert alert-danger">Impossible de charger les paiements.</div>;

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Paiements</h1>
        <div className="text-muted">Suivi des paiements par période.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Liste</th>
                  <th>Référence externe</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.liste_reference || "-"}</td>
                    <td>{p.reference_externe || "-"}</td>
                    <td>{Number(p.montant).toLocaleString()} MRU</td>
                    <td>
                      {p.statut === "EFFECTUE" ? (
                        <span className="sehily-badge sehily-badge--ok">Effectué</span>
                      ) : (
                        <span className="sehily-badge sehily-badge--warn">En attente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

