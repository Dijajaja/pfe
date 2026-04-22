import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

export function AdminDossiersPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("numero");
  const [comment, setComment] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const dossiersQuery = useQuery({
    queryKey: ["admin", "dossiers"],
    queryFn: adminApi.listDossiers,
  });

  useEffect(() => {
    const data = dossiersQuery.data || [];
    const normalized = data.map((d) => ({
      id: d.id,
      numero: `DOS-${String(d.id).padStart(6, "0")}`,
      etudiant: d.etudiant || d.etudiant_email || `Utilisateur #${d.etudiant}`,
      annee: d.annee_universitaire,
      statut: d.statut,
      montant: Number(d.montant_bourse || 0),
    }));
    setRows(normalized);
  }, [dossiersQuery.data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateDossier(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "dossiers"] });
      setComment("");
      pushSuccess("Statut dossier mis à jour.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Échec mise à jour dossier.")),
  });

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    const base = rows.filter((r) => `${r.numero} ${r.etudiant} ${r.statut}`.toLowerCase().includes(q));
    return [...base].sort((a, b) => `${a[sortBy]}`.localeCompare(`${b[sortBy]}`));
  }, [rows, filter, sortBy]);

  const selected = rows.find((r) => r.id === selectedId) || null;

  function updateStatus(nextStatus) {
    if (!selectedId) return;
    updateMutation.mutate({
      id: selectedId,
      payload: { statut: nextStatus, commentaire_admin: comment },
    });
  }

  if (dossiersQuery.isError) return <div className="alert alert-danger">{getApiErrorMessage(dossiersQuery.error, "Erreur chargement dossiers.")}</div>;
  if (dossiersQuery.isLoading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Dossiers</h1>
        <div className="text-muted">Liste, filtre, tri, détail, validation/rejet + commentaire.</div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="sehily-surface p-3">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control form-control-sm"
              placeholder="Filtrer..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="numero">Tri: Numéro</option>
              <option value="etudiant">Tri: Étudiant</option>
              <option value="statut">Tri: Statut</option>
            </select>
          </div>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Étudiant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: "pointer", background: selectedId === r.id ? "var(--sehily-creme)" : "transparent" }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td>{r.numero}</td>
                    <td>{r.etudiant}</td>
                    <td>{r.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-5">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Détail dossier</div>
          {selected ? (
            <>
              <div className="small text-muted">Numéro</div>
              <div className="fw-semibold mb-2">{selected.numero}</div>
              <div className="small text-muted">Étudiant</div>
              <div className="fw-semibold mb-2">{selected.etudiant}</div>
              <div className="small text-muted">Montant</div>
              <div className="fw-semibold mb-2">{selected.montant.toLocaleString()} MRU</div>
              <div className="small text-muted">Statut actuel</div>
              <div className="fw-semibold mb-3">{selected.statut}</div>

              <textarea
                className="form-control mb-3"
                rows={3}
                placeholder="Commentaire admin"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="d-flex gap-2">
                <button className="btn sehily-btn-primary" onClick={() => updateStatus("VALIDE")} disabled={updateMutation.isPending}>
                  Valider
                </button>
                <button className="btn sehily-btn-accent" onClick={() => updateStatus("REJETE")} disabled={updateMutation.isPending}>
                  Rejeter
                </button>
              </div>
            </>
          ) : (
            <div className="text-muted small">Sélectionne un dossier dans la liste.</div>
          )}
        </div>
      </div>
    </div>
  );
}

