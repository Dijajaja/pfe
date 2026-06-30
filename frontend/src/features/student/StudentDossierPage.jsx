import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Folder, GraduationCap, IdCard, Lock, Phone, Upload } from "lucide-react";

import { referentialApi, studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";
import { canSubmitDossierStatut, validateDossierSubmission } from "../../lib/dossierSubmission";
import { authApi } from "../../lib/api";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 5 * 1024 * 1024;

function toMb(size) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function InfoField({ icon, label, children }) {
  return (
    <div className="student-dossier-info-field d-flex align-items-stretch gap-2 rounded-3 p-2 border w-100">
      <div className="student-dossier-info-field__icon d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle">{icon}</div>
      <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-center">
        <div className="student-dossier-info-field__label text-muted text-uppercase">{label}</div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function StudentDossierForm({ dossier, profile, activeAnnees, queryClient, pushError, pushSuccess, pushInfo }) {
  const fileInputRef = useRef(null);
  const profil = profile?.profil_etudiant || {};

  // Pré-remplissage priorité : dossier existant > profil CNOU
  const initialCni = dossier?.numero_cni || profil.nni || "";
  const initialTel = dossier?.telephone || profil.telephone || "";
  const initialNiveau = dossier?.niveau || profil.annee_courante || "L1";

  const [form, setForm] = useState({
    numero_cni: initialCni,
    telephone: initialTel,
    niveau: initialNiveau,
  });

  // CNI et niveau verrouillés si provenant du profil officiel
  const cniFromProfile = Boolean(profil.nni) && !dossier?.numero_cni;
  const niveauFromProfile = Boolean(profil.annee_courante) && !dossier?.niveau;
  const [typePiece, setTypePiece] = useState("CNI");
  const [files, setFiles] = useState([]);
  const [feedback, setFeedback] = useState("");

  const headerEmail = (dossier?.etudiant_email || "").trim() || "—";
  const existingDocuments = dossier?.documents || [];
  const isEditable = canSubmitDossierStatut(dossier?.statut);

  function resolveAnneeUniversitaire() {
    const fromDossier = dossier?.annee_universitaire;
    if (fromDossier != null && fromDossier !== "") return Number(fromDossier);
    if (activeAnnees[0]?.id != null) return Number(activeAnnees[0].id);
    return null;
  }

  function buildFieldPayload() {
    const anneeId = resolveAnneeUniversitaire();
    return {
      ...(anneeId != null ? { annee_universitaire: anneeId } : {}),
      numero_cni: form.numero_cni.trim(),
      telephone: form.telephone.trim(),
      niveau: form.niveau,
    };
  }

  const submissionCheck = useMemo(
    () =>
      validateDossierSubmission({
        numero_cni: form.numero_cni,
        telephone: form.telephone,
        niveau: form.niveau,
        anneeUniversitaireId: resolveAnneeUniversitaire(),
        existingDocumentsCount: existingDocuments.length,
        pendingFilesCount: files.length,
      }),
    [form.numero_cni, form.telephone, form.niveau, dossier?.annee_universitaire, activeAnnees, existingDocuments.length, files.length],
  );

  const canSubmit = isEditable && submissionCheck.ok;

  const soumettreMutation = useMutation({
    mutationFn: async () => {
      if (!submissionCheck.ok) {
        throw new Error(`Complétez le dossier avant soumission : ${submissionCheck.missing.join(", ")}.`);
      }
      const fieldPayload = buildFieldPayload();
      let targetDossier;
      if (dossier?.id) {
        targetDossier = await studentApi.updateDossier(dossier.id, fieldPayload);
      } else {
        targetDossier = await studentApi.createDossier(fieldPayload);
      }
      const dossierId = targetDossier.id;
      for (const fichier of files) {
        await studentApi.uploadDocument({
          dossier: dossierId,
          type_piece: typePiece,
          fichier,
        });
      }
      return studentApi.updateDossier(dossierId, { statut: "SOUMIS" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["student", "dossiers"] });
      setFiles([]);
      setFeedback("Dossier soumis avec succès.");
      pushSuccess("Dossier soumis avec succès.");
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Erreur lors de la soumission du dossier.");
      setFeedback(msg);
      pushError(msg);
    },
  });

  function onFileInput(selected) {
    const arr = Array.from(selected || []);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    onFileInput(e.dataTransfer.files);
  }

  return (
    <>
      <div className="col-12">
        <p className="student-dossier-lead mb-3">
          Renseignez tous les champs obligatoires et déposez au moins une pièce justificative pour pouvoir soumettre.
        </p>

        <div className="student-dossier-card-v1">
          <div className="student-dossier-card-head">
            <div className="student-dossier-card-head__brand">
              <div className="student-dossier-card-head__folder" aria-hidden>
                <Folder size={22} strokeWidth={2} />
              </div>
              <h1 className="h5 mb-0 fw-semibold text-white">Dossier étudiant</h1>
            </div>
            <span className="student-dossier-email-pill" title={headerEmail}>
              {headerEmail}
            </span>
          </div>

          <div className="p-3 p-md-4 student-dossier-card-body">
            <div className="row g-3 g-lg-4 align-items-stretch">
              <div className="col-12 col-md-6 d-flex flex-column">
                <div className="student-dossier-v1-section-title">Informations personnelles</div>
                <div className="d-flex flex-column gap-3 flex-grow-1">
                  <InfoField label="NNI *" icon={<IdCard size={20} strokeWidth={2} aria-hidden />}>
                    <input
                      className="form-control form-control-sm"
                      value={form.numero_cni}
                      onChange={(e) => setForm((f) => ({ ...f, numero_cni: e.target.value }))}
                      placeholder="Votre NNI (10 chiffres)"
                      autoComplete="off"
                      required
                      readOnly={cniFromProfile}
                      disabled={!isEditable}
                      title={cniFromProfile ? "NNI récupéré automatiquement — non modifiable" : undefined}
                    />

                  </InfoField>
                  <InfoField label="Numéro de téléphone *" icon={<Phone size={20} strokeWidth={2} aria-hidden />}>
                    <input
                      className="form-control form-control-sm"
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                      placeholder="Ex. 45 XX XX XX"
                      autoComplete="tel"
                      required
                      disabled={!isEditable}
                    />
                  </InfoField>
                  <InfoField label="Niveau d’étude *" icon={<GraduationCap size={20} strokeWidth={2} aria-hidden />}>
                    {niveauFromProfile || !isEditable ? (
                      <input
                        className="form-control form-control-sm"
                        value={form.niveau}
                        readOnly
                        disabled={!isEditable}
                        title="Niveau officiel CNOU — non modifiable"
                      />
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={form.niveau}
                        onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                        required
                      >
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                      </select>
                    )}

                  </InfoField>
                </div>
              </div>

              <div className="col-12 col-md-6 d-flex flex-column">
                <div className="student-dossier-v1-section-title">Pièce justificative *</div>
                <div className="text-muted small mb-1">Type de document</div>
                <input
                  className="form-control form-control-sm mb-3"
                  value="CNI (carte d’identité / scan)"
                  readOnly
                  disabled={!isEditable}
                />

                <div
                  className={`student-dossier-dropzone-v1 flex-grow-1 d-flex flex-column${!isEditable ? " opacity-50 pe-none" : ""}`}
                  onDrop={isEditable ? onDrop : undefined}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="student-dossier-upload-icon mx-auto" aria-hidden>
                    <Upload size={22} strokeWidth={2} />
                  </div>
                  <div className="fw-semibold small student-dossier-dropzone-v1__title">Déposer le fichier</div>
                  <div className="small text-muted">Glissez-déposez ici</div>
                  <div className="small text-muted">PDF / JPG / PNG — max 5 MB</div>
                </div>
                <div className="mt-2 student-dossier-file-below">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control form-control-sm student-dossier-native-file"
                    accept="application/pdf,image/png,image/jpeg"
                    multiple
                    onChange={(e) => onFileInput(e.target.files)}
                    disabled={!isEditable}
                  />
                  <div className="small text-muted mt-1 text-center">
                    {files.length || existingDocuments.length
                      ? `${existingDocuments.length + files.length} fichier${existingDocuments.length + files.length > 1 ? "s" : ""} au total`
                      : "Aucun fichier sélectionné"}
                  </div>
                  {existingDocuments.length > 0 ? (
                    <ul className="student-dossier-file-list small mb-0 ps-3 mt-2 text-start w-100">
                      {existingDocuments.map((doc) => (
                        <li key={doc.id} className="text-break">
                          {doc.nom_fichier || doc.type_piece}{" "}
                          <span className="text-muted">({doc.type_piece} — déjà déposé)</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {files.length > 0 ? (
                    <ul className="student-dossier-file-list small mb-0 ps-3 mt-2 text-start w-100">
                      {files.map((f) => (
                        <li key={`${f.name}-${f.size}`} className="text-break">
                          {f.name} <span className="text-muted">({toMb(f.size)})</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <footer className="student-dossier-foot">
            <div className="d-flex flex-column gap-2 small text-muted flex-grow-1">
              <div className="d-flex align-items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 student-dossier-foot__warn-icon" aria-hidden />
                <span>
                  Formats acceptés : <strong className="text-body">PDF, JPG, PNG</strong>
                </span>
              </div>
              {isEditable && !submissionCheck.ok ? (
                <div className="text-danger">
                  Champs manquants : {submissionCheck.missing.join(", ")}.
                </div>
              ) : null}
            </div>
            <button
              className="btn student-dossier-submit-btn d-inline-flex align-items-center gap-2"
              type="button"
              disabled={!canSubmit || soumettreMutation.isPending}
              title={
                !isEditable
                  ? "Dossier déjà soumis"
                  : !submissionCheck.ok
                    ? `Complétez : ${submissionCheck.missing.join(", ")}`
                    : "Soumettre le dossier"
              }
              onClick={() => {
                if (!canSubmit) return;
                setFeedback("");
                soumettreMutation.mutate();
              }}
            >
              {soumettreMutation.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Envoi…
                </>
              ) : (
                <>
                  Soumettre le dossier
                  <ArrowRight size={18} aria-hidden />
                </>
              )}
            </button>
          </footer>
        </div>
      </div>

      {!isEditable ? (
        <div className="col-12">
          <div className="alert alert-info mb-0">
            Ce dossier a déjà été soumis (statut : <strong>{dossier?.statut}</strong>). Les modifications ne sont plus possibles
            depuis cette page.
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="col-12">
          <div className="alert alert-info mb-0">{feedback}</div>
        </div>
      ) : null}
    </>
  );
}

export function StudentDossierPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();

  const anneesQuery = useQuery({
    queryKey: ["referential", "annees-actives"],
    queryFn: referentialApi.listAnneesActives,
  });
  const dossiersQuery = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
  });
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const r = await authApi.me();
      return r.data;
    },
    staleTime: 60_000,
  });

  const dossiers = dossiersQuery.data?.results || dossiersQuery.data || [];
  const currentDossier = dossiers[0] || null;
  const activeAnnees = anneesQuery.data || [];

  if (anneesQuery.isLoading || dossiersQuery.isLoading || profileQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  const formKey = currentDossier?.id != null ? String(currentDossier.id) : "nouveau";

  return (
    <div className="student-dossier-page">
      <div className="row g-4">
        <StudentDossierForm
          key={formKey}
          dossier={currentDossier}
          profile={profileQuery.data || null}
          activeAnnees={activeAnnees}
          queryClient={qc}
          pushError={pushError}
          pushSuccess={pushSuccess}
          pushInfo={pushInfo}
        />
      </div>
    </div>
  );
}
