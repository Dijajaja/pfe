import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiInbox } from "react-icons/fi";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

function StudentReclamationsBody() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();
  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  const reclamationsQuery = useQuery({
    queryKey: ["student", "reclamations"],
    queryFn: studentApi.listReclamations,
  });

  const createMutation = useMutation({
    mutationFn: studentApi.createReclamation,
    onSuccess: () => {
      setObjet("");
      setDescription("");
      pushSuccess("Réclamation envoyée avec succès.");
      queryClient.invalidateQueries({ queryKey: ["student", "reclamations"] });
    },
    onError: (error) => {
      pushError(getApiErrorMessage(error, "Impossible d'envoyer la réclamation."));
    },
  });

  const sourceRows = useMemo(() => reclamationsQuery.data || [], [reclamationsQuery.data]);
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return sourceRows;
    return sourceRows.filter((r) => `${r.objet} ${r.description} ${r.statut}`.toLowerCase().includes(needle));
  }, [sourceRows, search]);

  const isFilteredEmpty = sourceRows.length > 0 && rows.length === 0;

  function submitForm(e) {
    e.preventDefault();
    const cleanObjet = objet.trim();
    const cleanDescription = description.trim();
    if (!cleanObjet || !cleanDescription) return;
    createMutation.mutate({
      objet: cleanObjet,
      description: cleanDescription,
    });
  }

  if (reclamationsQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Passer une réclamation</h1>
        <div className="text-muted">Déposez une demande, puis suivez son traitement par l'administration.</div>
      </div>

      <div className="col-12 col-xl-5">
        <form className="sehily-surface p-3 d-grid gap-3" onSubmit={submitForm}>
          <div className="fw-bold">Nouvelle réclamation</div>
          <div>
            <label className="form-label small">Objet</label>
            <input
              className="form-control"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Ex: Erreur montant de bourse"
              maxLength={255}
              required
            />
          </div>
          <div>
            <label className="form-label small">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              required
            />
          </div>
          <button className="btn sehily-btn-primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Envoi..." : "Envoyer la réclamation"}
          </button>
        </form>
      </div>

      <div className="col-12 col-xl-7">
        <div className="sehily-surface p-3">
          <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
            <div className="fw-bold">Mes réclamations</div>
            <input
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="Filtrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {reclamationsQuery.error ? (
            <div className="alert alert-danger py-2">
              {getApiErrorMessage(reclamationsQuery.error, "Impossible de charger les réclamations.")}
            </div>
          ) : null}
          {!rows.length ? (
            <div className="partner-payments-empty py-5 px-3 text-center">
              <div className="partner-payments-empty-icon mx-auto mb-3" aria-hidden="true">
                <FiInbox size={28} strokeWidth={1.25} />
              </div>
              <div className="fw-semibold mb-1">{isFilteredEmpty ? "Aucun résultat" : "Aucune réclamation pour le moment"}</div>
              <p className="small text-muted mb-0">
                {isFilteredEmpty
                  ? "Modifiez le filtre pour afficher vos réclamations."
                  : "Lorsque vous envoyez une demande, elle apparaîtra ici avec son statut."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm admin-table-pro admin-table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Objet</th>
                    <th>Statut</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.date_creation).toLocaleString()}</td>
                      <td>{row.objet}</td>
                      <td>{row.statut}</td>
                      <td>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Remount when URL search `q` changes so the filter field stays in sync with la recherche globale. */
export function StudentReclamationsPage() {
  const [searchParams] = useSearchParams();
  const urlQKey = searchParams.get("q") ?? "";
  return <StudentReclamationsBody key={urlQKey} />;
}
