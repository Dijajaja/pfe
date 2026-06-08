import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";

function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("fr-FR");
}

function formatInstructeurLabel(instructeur) {
  if (!instructeur) return "—";
  if (typeof instructeur === "object") {
    return instructeur.email || instructeur.username || "Administration";
  }
  return "Administration";
}

function SuiviStatutBadge({ statut }) {
  const raw = String(statut || "").trim();
  if (raw.startsWith("RECLAMATION:")) {
    const inner = raw.split(":")[1] || "Réclamation";
    return <span className="student-suivi-statut-badge student-suivi-statut-badge--reclam">{inner}</span>;
  }
  const u = raw.toUpperCase();
  if (u === "VALIDE") return <span className="student-suivi-statut-badge student-suivi-statut-badge--ok">Validé</span>;
  if (u === "REJETE") return <span className="student-suivi-statut-badge student-suivi-statut-badge--danger">Rejeté</span>;
  if (u === "EN_INSTRUCTION" || u === "COMPLEMENT_DEMANDE")
    return <span className="student-suivi-statut-badge student-suivi-statut-badge--warn">En instruction</span>;
  if (u === "SOUMIS") return <span className="student-suivi-statut-badge student-suivi-statut-badge--neutral">Soumis</span>;
  if (u === "BROUILLON") return <span className="student-suivi-statut-badge student-suivi-statut-badge--muted">Brouillon</span>;
  if (!raw) return <span className="student-suivi-statut-badge student-suivi-statut-badge--muted">—</span>;
  return <span className="student-suivi-statut-badge student-suivi-statut-badge--muted">{raw}</span>;
}

function timelineDotClass(statut) {
  const raw = String(statut || "");
  if (raw.startsWith("RECLAMATION:")) return "student-suivi-timeline-dot--neutral";
  const u = raw.toUpperCase();
  if (u === "VALIDE") return "student-suivi-timeline-dot--ok";
  if (u === "REJETE") return "student-suivi-timeline-dot--danger";
  if (u === "EN_INSTRUCTION" || u === "COMPLEMENT_DEMANDE") return "student-suivi-timeline-dot--warn";
  return "student-suivi-timeline-dot--neutral";
}

function StudentSuiviBody() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

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

  const primaryDossier = useMemo(() => {
    const dossiers = dossiersQuery.data?.results || dossiersQuery.data || [];
    if (!dossiers.length) return null;
    return [...dossiers].sort((a, b) => {
      const tb = new Date(b.modifie_le || b.cree_le).getTime();
      const ta = new Date(a.modifie_le || a.cree_le).getTime();
      return tb - ta;
    })[0];
  }, [dossiersQuery.data]);

  const filtered = useMemo(
    () => historyRows.filter((x) => `${x.statut} ${x.commentaire} ${x.auteur}`.toLowerCase().includes(search.toLowerCase())),
    [search, historyRows],
  );

  const statutActuel = primaryDossier?.statut ?? null;
  const dateValidation =
    primaryDossier && String(primaryDossier.statut || "").toUpperCase() === "VALIDE"
      ? formatDateTime(primaryDossier.modifie_le || primaryDossier.cree_le) || "—"
      : "—";
  const auteurValidation =
    primaryDossier && String(primaryDossier.statut || "").toUpperCase() === "VALIDE"
      ? formatInstructeurLabel(primaryDossier.instructeur)
      : "—";

  if (dossiersQuery.isLoading || reclamationsQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="row g-4 student-suivi-pro">
      <div className="col-12">
        <div className="text-muted">Historique des statuts et actions.</div>
      </div>
      <div className="col-12">
        <div className="student-suivi-stats-row">
          <div className="student-suivi-stat-card">
            <div className="student-suivi-stat-label">Statut actuel</div>
            <div className="student-suivi-stat-value">
              {statutActuel ? <SuiviStatutBadge statut={statutActuel} /> : <span className="text-muted">Aucun dossier</span>}
            </div>
          </div>
          <div className="student-suivi-stat-card">
            <div className="student-suivi-stat-label">Date de validation</div>
            <div className="student-suivi-stat-value">{dateValidation}</div>
          </div>
          <div className="student-suivi-stat-card">
            <div className="student-suivi-stat-label">Auteur (validation)</div>
            <div className="student-suivi-stat-value">{auteurValidation}</div>
          </div>
        </div>

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

          {!filtered.length ? (
            <div className="student-suivi-empty">
              <div className="fw-semibold mb-1">Aucune entrée à afficher</div>
              <p className="small text-muted mb-0">Modifiez le filtre ou revenez plus tard lorsque votre dossier évoluera.</p>
            </div>
          ) : (
            <ul className="student-suivi-timeline">
              {filtered.map((row) => (
                <li key={row.id} className="student-suivi-timeline-item">
                  <span className={`student-suivi-timeline-dot ${timelineDotClass(row.statut)}`} aria-hidden />
                  <div className="student-suivi-timeline-card">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <span className="small text-muted">{formatDateTime(row.date) || "—"}</span>
                      <SuiviStatutBadge statut={row.statut} />
                    </div>
                    <div className="student-suivi-timeline-meta">
                      <span className="fw-semibold">{row.auteur}</span>
                      {row.commentaire ? (
                        <>
                          {" · "}
                          {row.commentaire}
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Remount when URL search `q` changes so the filter field stays in sync with la recherche globale. */
export function StudentSuiviPage() {
  const [searchParams] = useSearchParams();
  const urlQKey = searchParams.get("q") ?? "";
  return <StudentSuiviBody key={urlQKey} />;
}
