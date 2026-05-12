import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { isApiFallbackEnabled } from "../../lib/apiFallbackConfig";
import { getApiErrorMessage } from "../../lib/apiError";
import { StatusBadge } from "../../components/dashboard/StatusBadge";

const PAGE_SIZE = 10;
const MAURITANIA_WILAYAS = [
  "Adrar",
  "Assaba",
  "Brakna",
  "Dakhlet Nouadhibou",
  "Gorgol",
  "Guidimakha",
  "Hodh Ech Chargui",
  "Hodh El Gharbi",
  "Inchiri",
  "Nouakchott-Nord",
  "Nouakchott-Ouest",
  "Nouakchott-Sud",
  "Tagant",
  "Tiris Zemmour",
  "Trarza",
];

function userInitials(u) {
  const fn = (u.first_name || "").trim();
  const ln = (u.last_name || "").trim();
  if (fn || ln) {
    return `${fn.slice(0, 1)}${ln.slice(0, 1)}`.toUpperCase() || fn.slice(0, 2).toUpperCase() || "U";
  }
  const em = (u.email || "U").trim();
  return em.slice(0, 2).toUpperCase();
}

function displayFullName(u) {
  const joined = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  return u.full_name || u.email || "—";
}

function CreateUserModal({ open, onClose, draft, setDraft, onSubmit, isPending, createdAccount }) {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="modal-create-title" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <h2 id="modal-create-title" className="h5 mb-0">
            Créer un étudiant
          </h2>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
        <form className="d-grid gap-2" onSubmit={onSubmit}>
          <input
            className="form-control form-control-sm"
            type="email"
            placeholder="email@domaine.mr"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <input
                className="form-control form-control-sm"
                placeholder="Prénom"
                value={draft.first_name}
                onChange={(e) => setDraft((d) => ({ ...d, first_name: e.target.value }))}
              />
            </div>
            <div className="col-6">
              <input
                className="form-control form-control-sm"
                placeholder="Nom"
                value={draft.last_name}
                onChange={(e) => setDraft((d) => ({ ...d, last_name: e.target.value }))}
              />
            </div>
          </div>
          <input
            className="form-control form-control-sm"
            placeholder="Matricule"
            value={draft.matricule}
            onChange={(e) => setDraft((d) => ({ ...d, matricule: e.target.value }))}
            required
          />
          <input
            className="form-control form-control-sm"
            placeholder="Établissement"
            value={draft.etablissement}
            onChange={(e) => setDraft((d) => ({ ...d, etablissement: e.target.value }))}
            required
          />
          <input
            className="form-control form-control-sm"
            placeholder="Filière"
            value={draft.filiere}
            onChange={(e) => setDraft((d) => ({ ...d, filiere: e.target.value }))}
            required
          />
          <select className="form-select form-select-sm" value={draft.wilaya} onChange={(e) => setDraft((d) => ({ ...d, wilaya: e.target.value }))}>
            <option value="">Wilaya (optionnel)</option>
            {MAURITANIA_WILAYAS.map((wilaya) => (
              <option key={wilaya} value={wilaya}>
                {wilaya}
              </option>
            ))}
          </select>
          <button className="btn sehily-btn-primary btn-sm mt-1" type="submit" disabled={isPending}>
            {isPending ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
            Créer le compte
          </button>
          {createdAccount ? (
            <div className="alert alert-success mb-0 py-2 small">
              <div className="fw-semibold">Compte créé : {createdAccount.email}</div>
              <div>
                Mot de passe temporaire : <code>{createdAccount.temporary_password || "N/A"}</code>
              </div>
              <div>
                Email de confirmation : {createdAccount.email_sent ? "envoyé" : "non envoyé"}
                {!createdAccount.email_sent && createdAccount.email_error ? ` (${createdAccount.email_error})` : ""}
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function ImportCsvModal({ open, onClose, onPickFile, isPending, feedback }) {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="modal-import-title" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h2 id="modal-import-title" className="h5 mb-0">
            Import CSV (CNOU)
          </h2>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
        <p className="small text-muted mb-3">Format attendu : email, matricule, etablissement, filiere (+ optionnel wilaya).</p>
        <input className="form-control form-control-sm" type="file" accept=".csv,text/csv" disabled={isPending} onChange={(e) => onPickFile(e.target.files?.[0])} />
        {isPending ? (
          <div className="d-flex align-items-center gap-2 small text-muted mt-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            Import en cours…
          </div>
        ) : null}
        {feedback ? <div className="alert alert-info mb-0 py-2 small mt-2">{feedback}</div> : null}
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [draft, setDraft] = useState({
    email: "",
    first_name: "",
    last_name: "",
    matricule: "",
    etablissement: "",
    filiere: "",
    wilaya: "",
  });
  const [createdAccount, setCreatedAccount] = useState(null);
  const [importFeedback, setImportFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState("ALL");
  const [niveauFilter, setNiveauFilter] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) setSearch(q);
  }, [searchParams]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
  });

  const users = useMemo(() => {
    const data = usersQuery.data;
    if (!Array.isArray(data)) return [];
    return data.map((u) => ({
      ...u,
      actif: u.actif ?? u.is_active ?? true,
      fullName:
        u.full_name ||
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        u.email,
      dateCreation: u.date_creation || null,
      dossierId: u.dossier_id || null,
      dossierStatut: u.dossier_statut || null,
      niveau: u.niveau || null,
      wilaya: u.wilaya || "Non renseignée",
      isEligible: typeof u.is_eligible === "boolean" ? u.is_eligible : u.dossier_statut === "VALIDE",
    }));
  }, [usersQuery.data]);

  const stats = useMemo(() => {
    const list = users;
    const total = list.length;
    const pending = list.filter((u) => {
      if (u.dossierStatut === "REJETE") return false;
      if (u.isEligible === true || ["VALIDE", "ENVOYE", "PAYE"].includes(u.dossierStatut)) return false;
      return true;
    }).length;
    const validated = list.filter((u) => u.isEligible === true || ["VALIDE", "ENVOYE", "PAYE"].includes(u.dossierStatut)).length;
    const rejected = list.filter((u) => u.dossierStatut === "REJETE").length;
    return { total, pending, validated, rejected };
  }, [users]);

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      pushSuccess("Utilisateur mis à jour.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Impossible de mettre à jour l’utilisateur.")),
  });
  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      pushSuccess("Utilisateur supprimé.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Impossible de supprimer l’utilisateur.")),
  });
  const createUserMutation = useMutation({
    mutationFn: (payload) => adminApi.createStudentUser(payload),
    onSuccess: async (payload) => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreatedAccount(payload);
      setDraft({
        email: "",
        first_name: "",
        last_name: "",
        matricule: "",
        etablissement: "",
        filiere: "",
        wilaya: "",
      });
      pushSuccess("Étudiant créé avec succès.");
    },
    onError: (err) => pushError(getApiErrorMessage(err, "Impossible de créer l’étudiant.")),
  });

  const importMutation = useMutation({
    mutationFn: (file) => adminApi.importUsersCsv(file),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setImportFeedback(
        `Import terminé : ${result.imported ?? 0} créé(s), ${result.updated ?? 0} mis à jour, ${result.errors?.length ?? 0} erreur(s).`,
      );
      pushSuccess("Import CSV terminé.");
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, "Import CSV impossible.");
      setImportFeedback(msg);
      pushError(msg);
    },
  });

  function toggleActive(id) {
    const current = users.find((u) => u.id === id);
    if (!current) return;
    updateUserMutation.mutate({
      id,
      payload: { is_active: !current.actif },
    });
  }

  function onCreate(e) {
    e.preventDefault();
    if (!draft.email.trim() || !draft.matricule.trim() || !draft.etablissement.trim() || !draft.filiere.trim()) {
      pushInfo("Merci de remplir les champs obligatoires (email, matricule, établissement, filière).");
      return;
    }
    createUserMutation.mutate({
      email: draft.email.trim(),
      first_name: draft.first_name.trim(),
      last_name: draft.last_name.trim(),
      matricule: draft.matricule.trim(),
      etablissement: draft.etablissement.trim(),
      filiere: draft.filiere.trim(),
      wilaya: draft.wilaya.trim(),
    });
  }

  function removeUser(id, email) {
    if (deleteUserMutation.isPending) return;
    const ok = window.confirm(`Supprimer l'utilisateur ${email} ?`);
    if (!ok) return;
    deleteUserMutation.mutate(id);
  }

  function parseCsvText(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((x) => x.trim().toLowerCase());
    const idxEmail = headers.indexOf("email");
    const idxMatricule = headers.indexOf("matricule");
    const idxEtablissement = headers.indexOf("etablissement");
    const idxFiliere = headers.indexOf("filiere");
    const idxWilaya = headers.indexOf("wilaya");
    if (idxEmail < 0 || idxMatricule < 0 || idxEtablissement < 0 || idxFiliere < 0) {
      throw new Error("Le CSV doit contenir: email, matricule, etablissement, filiere.");
    }
    const parsed = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].split(",").map((x) => x.trim());
      const email = cols[idxEmail];
      const matricule = cols[idxMatricule];
      const etablissement = cols[idxEtablissement];
      const filiere = cols[idxFiliere];
      const wilaya = idxWilaya >= 0 ? cols[idxWilaya] : "";
      if (!email) continue;
      parsed.push({
        id: Date.now() + i,
        email,
        fullName: email,
        actif: true,
        matricule,
        etablissement,
        filiere,
        wilaya: wilaya || "Non renseignée",
        niveau: null,
        dossierStatut: null,
        isEligible: false,
      });
    }
    return parsed;
  }

  async function onImportCsv(file) {
    if (!file) return;
    if (importMutation.isPending) return;
    if (isApiFallbackEnabled()) {
      try {
        const text = await file.text();
        const parsed = parseCsvText(text);
        if (!parsed.length) {
          setImportFeedback("Aucune ligne valide trouvée dans le CSV.");
          return;
        }
        setImportFeedback(`${parsed.length} ligne(s) valides analysées (mode démo : activez l’API pour persister).`);
      } catch (e) {
        setImportFeedback(e.message || "Import CSV impossible.");
      }
      return;
    }
    importMutation.mutate(file);
  }

  if (usersQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }
  if (usersQuery.isError) {
    return <div className="alert alert-danger">{getApiErrorMessage(usersQuery.error, "Erreur chargement utilisateurs.")}</div>;
  }

  const q = search.trim().toLowerCase();
  const wilayaOptions = ["ALL", ...MAURITANIA_WILAYAS, "Non renseignée"];
  const filteredUsers = users.filter((u) => {
    const searchOk = `${u.fullName} ${u.email} ${u.matricule || ""}`.toLowerCase().includes(q);
    const wilayaOk = wilayaFilter === "ALL" ? true : (u.wilaya || "Non renseignée") === wilayaFilter;
    const niveauOk = niveauFilter === "ALL" ? true : (u.niveau || "NON_RENSEIGNE") === niveauFilter;
    const eligibilityOk =
      eligibilityFilter === "ALL" ? true : eligibilityFilter === "ELIGIBLE" ? u.isEligible === true : u.isEligible === false || u.isEligible == null;
    const activeOk = activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? u.actif : !u.actif;
    return searchOk && wilayaOk && niveauOk && eligibilityOk && activeOk;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-users-page">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h4 mb-1">Admin — Utilisateurs</h1>
          <div className="text-muted">Gestion des étudiants, activation / désactivation, import CSV CNOU.</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm sehily-btn-primary" onClick={() => { setCreatedAccount(null); setShowCreateModal(true); }}>
            Ajouter un étudiant
          </button>
          <button
            type="button"
            className="btn btn-sm sehily-btn-secondary"
            onClick={() => {
              setImportFeedback("");
              setShowImportModal(true);
            }}
          >
            Importer CSV
          </button>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card">
            <div className="admin-dossiers-stat-label">Total</div>
            <div className="admin-dossiers-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--pending">
            <div className="admin-dossiers-stat-label">En attente</div>
            <div className="admin-dossiers-stat-value">{stats.pending}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--ok">
            <div className="admin-dossiers-stat-label">Validés</div>
            <div className="admin-dossiers-stat-value">{stats.validated}</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="sehily-surface p-3 h-100 admin-dossiers-stat-card admin-dossiers-stat-card--danger">
            <div className="admin-dossiers-stat-label">Rejetés</div>
            <div className="admin-dossiers-stat-value">{stats.rejected}</div>
          </div>
        </div>
      </div>

      <div className="sehily-surface p-3">
        <div className="admin-dossiers-filters admin-users-filters--tight mb-3">
          <input
            className="form-control form-control-sm admin-dossiers-filter-search"
            placeholder="Rechercher (nom, email, matricule)…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Recherche utilisateurs"
          />
          <select className="form-select form-select-sm" value={wilayaFilter} onChange={(e) => { setWilayaFilter(e.target.value); setPage(1); }} aria-label="Wilaya">
            <option value="ALL">Toutes wilayas</option>
            {wilayaOptions.filter((w) => w !== "ALL").map((wilaya) => (
              <option key={wilaya} value={wilaya}>
                {wilaya}
              </option>
            ))}
          </select>
          <select className="form-select form-select-sm" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); setPage(1); }} aria-label="Niveau">
            <option value="ALL">Tous niveaux</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="NON_RENSEIGNE">Non renseigné</option>
          </select>
          <select className="form-select form-select-sm" value={eligibilityFilter} onChange={(e) => { setEligibilityFilter(e.target.value); setPage(1); }} aria-label="Éligibilité">
            <option value="ALL">Tous (éligibilité)</option>
            <option value="ELIGIBLE">Éligible</option>
            <option value="NON_ELIGIBLE">Non éligible</option>
          </select>
          <select className="form-select form-select-sm" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }} aria-label="État compte">
            <option value="ALL">Tous états</option>
            <option value="ACTIVE">Actifs</option>
            <option value="INACTIVE">Inactifs</option>
          </select>
        </div>

        {usersQuery.isFetching ? (
          <div className="d-flex align-items-center gap-2 small text-muted mb-2">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            Actualisation…
          </div>
        ) : null}

        <div className="table-responsive admin-dossiers-table-wrap">
          <table className="table table-sm align-middle admin-table-pro admin-table-hover mb-0">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Utilisateur</th>
                <th>Date d’inscription</th>
                <th>Wilaya</th>
                <th>Niveau</th>
                <th>Statut dossier</th>
                <th>Éligibilité</th>
                <th>État</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2 min-w-0">
                      <span className="admin-user-cell-avatar flex-shrink-0">{userInitials(u)}</span>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate" title={displayFullName(u)}>
                          {displayFullName(u)}
                        </div>
                        <div className="small text-muted text-truncate" title={u.email}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-nowrap small">{u.dateCreation ? new Date(u.dateCreation).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="small">{u.wilaya || "Non renseignée"}</td>
                  <td className="text-nowrap small">{u.niveau || "—"}</td>
                  <td>
                    {u.dossierStatut ? (
                      <StatusBadge status={u.dossierStatut} />
                    ) : (
                      <span className="sehily-badge sehily-badge--warn">Sans dossier</span>
                    )}
                  </td>
                  <td>
                    <span className={`sehily-badge ${u.isEligible ? "sehily-badge--ok" : "sehily-badge--danger"}`}>{u.isEligible ? "Éligible" : "Non éligible"}</span>
                  </td>
                  <td>
                    <span className={`sehily-badge ${u.actif ? "sehily-badge--ok" : "sehily-badge--warn"}`}>{u.actif ? "Actif" : "Inactif"}</span>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex flex-wrap gap-1 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-sm sehily-btn-secondary"
                        onClick={() => toggleActive(u.id)}
                        disabled={updateUserMutation.isPending || deleteUserMutation.isPending}
                      >
                        {u.actif ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeUser(u.id, u.email)}
                        disabled={deleteUserMutation.isPending || updateUserMutation.isPending}
                      >
                        Supprimer
                      </button>
                      {u.dossierId ? (
                        <Link className="btn btn-sm sehily-btn-primary" to={`/app/admin/dossiers?dossier=${u.dossierId}`}>
                          Dossier
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!pagedUsers.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    Aucun utilisateur ne correspond aux filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">
            Page {currentPage}/{totalPages}
          </small>
          <div className="btn-group btn-group-sm">
            <button type="button" className="btn sehily-btn-secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Précédent
            </button>
            <button type="button" className="btn sehily-btn-secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Suivant
            </button>
          </div>
        </div>
      </div>

      <CreateUserModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreatedAccount(null);
        }}
        draft={draft}
        setDraft={setDraft}
        onSubmit={onCreate}
        isPending={createUserMutation.isPending}
        createdAccount={createdAccount}
      />
      <ImportCsvModal open={showImportModal} onClose={() => setShowImportModal(false)} onPickFile={onImportCsv} isPending={importMutation.isPending} feedback={importFeedback} />
    </div>
  );
}
