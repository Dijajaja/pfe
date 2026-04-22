import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { referentialApi, studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 5 * 1024 * 1024;

function toMb(size) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function StudentDossierPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [form, setForm] = useState({
    annee_universitaire: "",
    statut: "BROUILLON",
    commentaire: "",
  });
  const [typePiece, setTypePiece] = useState("CNI");
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState("");

  const anneesQuery = useQuery({
    queryKey: ["referential", "annees-actives"],
    queryFn: referentialApi.listAnneesActives,
  });
  const dossiersQuery = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });

  const dossiers = dossiersQuery.data?.results || dossiersQuery.data || [];
  const currentDossier = dossiers[0] || null;

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (currentDossier) {
        return studentApi.updateDossier(currentDossier.id, payload);
      }
      return studentApi.createDossier(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["student", "dossiers"] });
      setFeedback("Dossier enregistré avec succès.");
      pushSuccess("Dossier enregistré avec succès.");
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Erreur lors de l’enregistrement du dossier.");
      setFeedback(msg);
      pushError(msg);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const dossierId = currentDossier?.id;
      if (!dossierId) throw new Error("Crée d’abord un dossier.");
      for (const fichier of files) {
        await studentApi.uploadDocument({
          dossier: dossierId,
          type_piece: typePiece,
          fichier,
        });
      }
      return true;
    },
    onSuccess: () => {
      setFeedback("Documents envoyés avec succès.");
      setFiles([]);
      pushSuccess("Documents envoyés.");
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e, "Erreur upload documents.");
      setFeedback(msg);
      pushError(msg);
    },
  });

  function onFileInput(selected) {
    const arr = Array.from(selected);
    const validated = [];
    for (const f of arr) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        const msg = `Format refusé pour ${f.name}. Formats: PDF/JPG/PNG.`;
        setFeedback(msg);
        pushInfo(msg);
        continue;
      }
      if (f.size > MAX_SIZE) {
        const msg = `Fichier trop volumineux: ${f.name} (${toMb(f.size)} > 5 MB).`;
        setFeedback(msg);
        pushInfo(msg);
        continue;
      }
      validated.push(f);
    }
    setFiles((prev) => [...prev, ...validated]);
  }

  function onDrop(e) {
    e.preventDefault();
    onFileInput(e.dataTransfer.files);
  }

  function onSubmit(e) {
    e.preventDefault();
    setFeedback("");
    saveMutation.mutate({
      annee_universitaire: Number(selectedAnnee),
      statut: form.statut,
      commentaire_admin: form.commentaire,
    });
  }

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const activeAnnees = anneesQuery.data || [];
  const selectedAnnee = form.annee_universitaire || currentDossier?.annee_universitaire || "";

  if (anneesQuery.isLoading || dossiersQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Dossier étudiant</h1>
        <div className="text-muted">Création/édition + dépôt documents avec validation formats.</div>
      </div>

      <div className="col-12 col-lg-7">
        <form className="sehily-surface p-3 d-grid gap-3" onSubmit={onSubmit}>
          <div>
            <label className="form-label">Année universitaire</label>
            <select
              className="form-select"
              value={selectedAnnee}
              onChange={(e) => setForm((f) => ({ ...f, annee_universitaire: e.target.value }))}
              required
            >
              <option value="">-- choisir --</option>
              {activeAnnees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Statut étudiant</label>
            <select
              className="form-select"
              value={form.statut}
              onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value }))}
              required
            >
              <option value="BROUILLON">BROUILLON</option>
              <option value="SOUMIS">SOUMIS</option>
            </select>
          </div>
          <div>
            <label className="form-label">Commentaire</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.commentaire}
              onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
            />
          </div>
          <div className="d-flex gap-2">
            <button className="btn sehily-btn-primary" type="submit" disabled={saveMutation.isPending}>
              Sauvegarder
            </button>
            <button
              className="btn sehily-btn-accent"
              type="button"
              disabled={saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({
                  annee_universitaire: Number(selectedAnnee),
                  statut: "SOUMIS",
                  commentaire_admin: form.commentaire,
                })
              }
            >
              Soumettre dossier
            </button>
          </div>
        </form>
      </div>

      <div className="col-12 col-lg-5">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Documents</div>
          <div
            className="border rounded-3 p-3 mb-3"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{ borderStyle: "dashed", background: "var(--sehily-creme)" }}
          >
            <div className="small mb-2">Glisse-dépose ici (PDF/JPG/PNG, max 5 MB)</div>
            <select className="form-select form-select-sm mb-2" value={typePiece} onChange={(e) => setTypePiece(e.target.value)}>
              <option value="CNI">CNI</option>
              <option value="BAC">Baccalauréat</option>
              <option value="INSCRIPTION">Attestation d’inscription</option>
              <option value="RELEVE">Relevé</option>
            </select>
            <input className="form-control" type="file" multiple onChange={(e) => onFileInput(e.target.files)} />
          </div>

          <div className="small text-muted mb-2">
            {files.length} fichier(s) — taille totale: {toMb(totalSize)}
          </div>
          <ul className="list-group">
            {files.map((f, idx) => (
              <li key={`${f.name}-${idx}`} className="list-group-item d-flex justify-content-between">
                <span>{f.name}</span>
                <span className="text-muted small">{toMb(f.size)}</span>
              </li>
            ))}
          </ul>
          <button
            className="btn sehily-btn-primary mt-3"
            disabled={!files.length || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            Envoyer les documents
          </button>
        </div>
      </div>

      {feedback ? (
        <div className="col-12">
          <div className="alert alert-info mb-0">{feedback}</div>
        </div>
      ) : null}
    </div>
  );
}

