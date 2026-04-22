import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { partnerApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

export function PartnerBatchesPage() {
  const { pushError, pushSuccess } = useAppToast();
  const [reference, setReference] = useState("");
  const [liste, setListe] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  const fetchMutation = useMutation({
    mutationFn: (ref) => partnerApi.getListeByReference(ref),
    onSuccess: (data) => {
      setListe(data);
      setFeedback("");
      pushSuccess("Liste partenaire chargée.");
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Liste introuvable ou non assignée à ce partenaire.");
      setFeedback(msg);
      pushError(msg);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (operations) => partnerApi.confirmPaiements(operations),
    onSuccess: async () => {
      if (reference) {
        const data = await partnerApi.getListeByReference(reference);
        setListe(data);
      }
      setFeedback("Confirmations envoyées.");
      setHistory((prev) => [
        {
          id: Date.now(),
          date: new Date().toLocaleString(),
          reference: reference || "-",
          detail: "Paiements confirmés",
        },
        ...prev,
      ]);
      pushSuccess("Confirmations envoyées.");
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Échec confirmation paiements.");
      setFeedback(msg);
      pushError(msg);
    },
  });

  function confirmAll() {
    if (!liste?.paiements?.length) return;
    const operations = liste.paiements.map((p) => ({
      id: p.id,
      statut: "EFFECTUE",
      reference_externe: `EXT-${p.id}`,
    }));
    confirmMutation.mutate(operations);
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Mauriposte — Dashboard</h1>
        <div className="text-muted">Liste dossiers acceptés, confirmation paiement effectué, historique des versements.</div>
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="d-flex gap-2 mb-3">
            <input
              className="form-control"
              placeholder="Référence UUID de la liste"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <button
              className="btn sehily-btn-primary"
              onClick={() => fetchMutation.mutate(reference)}
              disabled={!reference || fetchMutation.isPending}
            >
              Charger
            </button>
            <button className="btn sehily-btn-accent" onClick={confirmAll} disabled={!liste?.paiements?.length || confirmMutation.isPending}>
              Confirmer tout
            </button>
          </div>
          {feedback ? <div className="alert alert-info">{feedback}</div> : null}
          {!feedback && !liste ? <div className="alert alert-secondary">Renseigne une référence UUID de lot puis clique Charger.</div> : null}
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Paiement ID</th>
                  <th>Dossier</th>
                  <th>Liste</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(liste?.paiements || []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.dossier_id}</td>
                    <td>{p.liste_reference}</td>
                    <td>{Number(p.montant).toLocaleString()} MRU</td>
                    <td>
                      {p.statut === "EFFECTUE" ? (
                        <span className="sehily-badge sehily-badge--ok">Confirmé</span>
                      ) : (
                        <span className="sehily-badge sehily-badge--warn">En attente</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm sehily-btn-primary"
                        disabled={p.statut === "EFFECTUE" || confirmMutation.isPending}
                        onClick={() =>
                          confirmMutation.mutate([
                            { id: p.id, statut: "EFFECTUE", reference_externe: `EXT-${p.id}` },
                          ])
                        }
                      >
                        Confirmer paiement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Historique des versements</div>
          {!history.length ? (
            <div className="text-muted small">Aucune confirmation enregistrée dans cette session.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence lot</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.date}</td>
                      <td>{h.reference}</td>
                      <td>{h.detail}</td>
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

