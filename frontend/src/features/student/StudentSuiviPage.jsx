import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";

export function StudentSuiviPage() {
  const [search, setSearch] = useState("");
  const dossiersQuery = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });
  const reclamationsQuery = useQuery({
    queryKey: ["student", "reclamations"],
    queryFn: studentApi.listReclamations,
  });

  const historyRows = useMemo(() => {
    const dossiers = dossiersQuery.data?.results || dossiersQuery.data || [];
    const dRows = dossiers.map((d) => ({
      id: `d-${d.id}`,
      date: d.modifie_le || d.cree_le,
      statut: d.statut,
      auteur: d.instructeur ? "Admin" : "Étudiant",
      commentaire: d.commentaire_admin || "Mise à jour dossier",
    }));

    const recs = reclamationsQuery.data || [];
    const rRows = recs.map((r) => ({
      id: `r-${r.id}`,
      date: r.date_maj || r.date_creation,
      statut: `RECLAMATION:${r.statut}`,
      auteur: "Support",
      commentaire: r.objet,
    }));

    return [...dRows, ...rRows].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [dossiersQuery.data, reclamationsQuery.data]);

  const filtered = useMemo(
    () => historyRows.filter((x) => `${x.statut} ${x.commentaire}`.toLowerCase().includes(search.toLowerCase())),
    [search, historyRows]
  );

  if (dossiersQuery.isLoading || reclamationsQuery.isLoading) {
    return <div className="p-3">Chargement suivi...</div>;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Suivi dossier</h1>
        <div className="text-muted">Historique des statuts et actions.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between mb-3">
            <div className="fw-bold">Historique</div>
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Auteur</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.date).toLocaleString()}</td>
                    <td>{row.statut}</td>
                    <td>{row.auteur}</td>
                    <td>{row.commentaire}</td>
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

