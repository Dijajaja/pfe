import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IdCard, Phone, User } from "lucide-react";

import { referentialApi, studentApi } from "../api/webFeaturesApi";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 5 * 1024 * 1024;

const sectionTitleClass = "fw-bold mb-2";
const sectionTitleStyle = { color: "var(--sehily-petrole)", fontSize: "1rem" };

function toMb(size) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function InfoField({ icon, label, children }) {
  return (
    <div
      className="d-flex align-items-stretch gap-2 rounded-3 p-2 border w-100"
      style={{ background: "color-mix(in srgb, var(--sehily-creme) 70%, #fff)", borderColor: "var(--sehily-border)" }}
    >
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
        style={{
          width: 44,
          height: 44,
          background: "color-mix(in srgb, var(--sehily-vert-pro) 22%, #fff)",
          color: "var(--sehily-vert-pro)",
        }}
      >
        {icon}
      </div>
      <div className="flex-grow-1 min-w-0 d-flex flex-column justify-content-center">
        <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.04em" }}>
          {label}
        </div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

export function StudentDossierPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [form, setForm] = useState({
    numero_cni: "",
    telephone: "",
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
  const activeAnnees = anneesQuery.data || [];

  useEffect(() => {
    if (!currentDossier) return;
    setForm((f) => ({
      ...f,
      numero_cni: currentDossier.numero_cni ?? "",
      telephone: currentDossier.telephone ?? "",
    }));
  }, [currentDossier?.id]);

  function resolveAnneeUniversitaire() {
    const fromDossier = currentDossier?.annee_universitaire;
    if (fromDossier != null && fromDossier !== "") return Number(fromDossier);
    if (activeAnnees[0]?.id != null) return Number(activeAnnees[0].id);
    return null;
  }

  function buildPayloadSoemis() {
    const anneeId = resolveAnneeUniversitaire();
    return {
      ...(anneeId != null ? { annee_universitaire: anneeId } : {}),
      statut: "SOUMIS",
      numero_cni: form.numero_cni,
      telephone: form.telephone,
    };
  }

  const soumettreMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayloadSoemis();
      let dossier;
      if (currentDossier) {
        dossier = await studentApi.updateDossier(currentDossier.id, payload);
      } else {
        dossier = await studentApi.createDossier(payload);
      }
      const dossierId = dossier.id;
      for (const fichier of files) {
        await studentApi.uploadDocument({
          dossier: dossierId,
          type_piece: typePiece,
          fichier,
        });
      }
      return dossierId;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["student", "dossiers"] });
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

  if (anneesQuery.isLoading || dossiersQuery.isLoading) {
    return <LoadingSkeleton lines={8} />;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <p
          className="mb-3 small"
          style={{ color: "color-mix(in srgb, var(--sehily-vert-pro) 75%, var(--sehily-text))" }}
        >
          Renseignez vos informations et déposez les pièces (formats validés — image ou PDF pour la CNI).
        </p>

        {/* Barre titre au-dessus du cadre blanc du formulaire */}
        <div
          className="d-flex align-items-center gap-3 py-3 px-3 px-md-4 w-100"
          style={{
            background: "var(--sehily-vert-pro)",
            color: "#fff",
            borderTopLeftRadius: "0.75rem",
            borderTopRightRadius: "0.75rem",
          }}
        >
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
            style={{
              width: 40,
              height: 40,
              background: "rgba(255, 255, 255, 0.2)",
              color: "#fff",
            }}
            aria-hidden
          >
            <User size={22} strokeWidth={2} />
          </div>
          <h1 className="h5 mb-0 fw-semibold text-white">Dossier étudiant</h1>
        </div>

        <div
          className="sehily-surface w-100 border-0 p-3 p-md-4"
          style={{
            borderBottomLeftRadius: "0.75rem",
            borderBottomRightRadius: "0.75rem",
            boxShadow: "0 8px 32px rgba(15, 79, 76, 0.12), 0 2px 8px rgba(15, 79, 76, 0.06)",
          }}
        >
            <div className="row g-3 g-lg-4 align-items-stretch">
              <div className="col-12 col-md-6 d-flex flex-column gap-3">
                <InfoField
                  label="CNI"
                  icon={<IdCard size={20} strokeWidth={2} aria-hidden />}
                >
                  <input
                    className="form-control form-control-sm"
                    value={form.numero_cni}
                    onChange={(e) => setForm((f) => ({ ...f, numero_cni: e.target.value }))}
                    placeholder="Numéro de la carte d’identité"
                    autoComplete="off"
                  />
                </InfoField>
                <InfoField
                  label="Numéro de téléphone"
                  icon={<Phone size={20} strokeWidth={2} aria-hidden />}
                >
                  <input
                    className="form-control form-control-sm"
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                    placeholder="Ex. 45 XX XX XX"
                    autoComplete="tel"
                  />
                </InfoField>
              </div>

              <div className="col-12 col-md-6 d-flex flex-column">
                <div className={sectionTitleClass} style={sectionTitleStyle}>
                  Type de document
                </div>
                <select
                  className="form-select mb-3"
                  value={typePiece}
                  onChange={(e) => setTypePiece(e.target.value)}
                >
                  <option value="CNI">CNI (carte d’identité / scan)</option>
                  <option value="BAC">Baccalauréat</option>
                  <option value="INSCRIPTION">Attestation d’inscription</option>
                  <option value="RELEVE">Relevé</option>
                </select>

                <div className={sectionTitleClass} style={sectionTitleStyle}>
                  Documents
                </div>
                <div
                  className="border rounded-3 p-3 d-flex flex-column flex-grow-1"
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ borderStyle: "dashed", background: "var(--sehily-creme)", minHeight: 160 }}
                >
                  <div className="small text-muted mb-2">Glissez-déposez ici (PDF / JPG / PNG, max 5 MB)</div>
                  <input
                    className="form-control mt-auto"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    multiple
                    onChange={(e) => onFileInput(e.target.files)}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end pt-3 mt-1">
              <button
                className="btn sehily-btn-accent"
                type="button"
                disabled={soumettreMutation.isPending}
                onClick={() => {
                  setFeedback("");
                  soumettreMutation.mutate();
                }}
              >
                Soumettre dossier
              </button>
            </div>
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
