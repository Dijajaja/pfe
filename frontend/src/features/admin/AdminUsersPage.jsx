import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiFlag, FiMapPin, FiSearch, FiShield } from "react-icons/fi";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

const PAGE_SIZE = 8;
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

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [users, setUsers] = useState([]);
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

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
  });

  useEffect(() => {
    const data = usersQuery.data;
    if (Array.isArray(data)) {
      const normalized = data.map((u) => ({
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
        isEligible:
          typeof u.is_eligible === "boolean"
            ? u.is_eligible
            : u.dossier_statut === "VALIDE",
      }));
      setUsers(normalized);
    }
  }, [usersQuery.data]);

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
        `Import terminé: ${result.imported ?? 0} créé(s), ${result.updated ?? 0} mis à jour, ${result.errors?.length ?? 0} erreur(s).`
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
    // Endpoint réel disponible; fallback local seulement en mode démo.
    if (import.meta.env.VITE_ENABLE_API_FALLBACK === "true") {
      try {
        const text = await file.text();
        const parsed = parseCsvText(text);
        if (!parsed.length) {
          setImportFeedback("Aucune ligne valide trouvée dans le CSV.");
          return;
        }
        setUsers((prev) => [...prev, ...parsed]);
        setImportFeedback(`${parsed.length} étudiant(s) importé(s) depuis le CSV.`);
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
      eligibilityFilter === "ALL"
        ? true
        : eligibilityFilter === "ELIGIBLE"
          ? u.isEligible === true
          : u.isEligible === false || u.isEligible == null;
    const activeOk = activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? u.actif : !u.actif;
    return searchOk && wilayaOk && niveauOk && eligibilityOk && activeOk;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Utilisateurs</h1>
        <div className="text-muted">Gestion des étudiants, activation/désactivation, import CSV CNOU.</div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="sehily-surface p-3">
          <div className="admin-users-filters-row mb-3">
            <div className="admin-users-filter-card admin-users-filter-card--search">
              <label className="form-label small mb-1 d-flex align-items-center gap-1">
                <FiSearch size={13} /> Recherche
              </label>
              <input
                className="form-control form-control-sm"
                placeholder="Nom, email, matricule..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="admin-users-filter-card">
              <label className="form-label small mb-1 d-flex align-items-center gap-1">
                <FiMapPin size={13} /> Wilaya
              </label>
              <select className="form-select form-select-sm" value={wilayaFilter} onChange={(e) => { setWilayaFilter(e.target.value); setPage(1); }}>
                <option value="ALL">Toutes</option>
                {wilayaOptions.filter((w) => w !== "ALL").map((wilaya) => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
            </div>
            <div className="admin-users-filter-card">
              <label className="form-label small mb-1 d-flex align-items-center gap-1">
                <FiFlag size={13} /> Niveau
              </label>
              <select className="form-select form-select-sm" value={niveauFilter} onChange={(e) => { setNiveauFilter(e.target.value); setPage(1); }}>
                <option value="ALL">Tous</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="NON_RENSEIGNE">Non renseigné</option>
              </select>
            </div>
            <div className="admin-users-filter-card">
              <label className="form-label small mb-1 d-flex align-items-center gap-1">
                <FiCheckCircle size={13} /> Éligibilité
              </label>
              <select className="form-select form-select-sm" value={eligibilityFilter} onChange={(e) => { setEligibilityFilter(e.target.value); setPage(1); }}>
                <option value="ALL">Tous</option>
                <option value="ELIGIBLE">Éligible</option>
                <option value="NON_ELIGIBLE">Non éligible</option>
              </select>
            </div>
            <div className="admin-users-filter-card">
              <label className="form-label small mb-1 d-flex align-items-center gap-1">
                <FiShield size={13} /> État
              </label>
              <select className="form-select form-select-sm" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
                <option value="ALL">Tous</option>
                <option value="ACTIVE">Actifs</option>
                <option value="INACTIVE">Inactifs</option>
              </select>
            </div>
          </div>
          {usersQuery.isFetching ? (
            <div className="d-flex align-items-center gap-2 small text-muted mb-2">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Actualisation en cours...
            </div>
          ) : null}
          <div className="table-responsive">
            <table className="table align-middle admin-table-hover">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Date d'inscription</th>
                  <th>Wilaya</th>
                  <th>Niveau</th>
                  <th>Statut dossier</th>
                  <th>Éligibilité</th>
                  <th>Actif</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-semibold">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.dateCreation ? new Date(u.dateCreation).toLocaleDateString("fr-FR") : "-"}</td>
                    <td>{u.wilaya || "Non renseignée"}</td>
                    <td>{u.niveau || "-"}</td>
                    <td>{u.dossierStatut || "-"}</td>
                    <td>
                      <span className={`sehily-badge ${u.isEligible ? "sehily-badge--ok" : "sehily-badge--warn"}`}>
                        {u.isEligible ? "Éligible" : "Non éligible"}
                      </span>
                    </td>
                    <td>{u.actif ? "Oui" : "Non"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm sehily-btn-secondary d-flex align-items-center gap-2" onClick={() => toggleActive(u.id)} disabled={updateUserMutation.isPending || deleteUserMutation.isPending}>
                          {updateUserMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                          {u.actif ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2"
                          onClick={() => removeUser(u.id, u.email)}
                          disabled={deleteUserMutation.isPending || updateUserMutation.isPending}
                        >
                          {deleteUserMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                          Supprimer
                        </button>
                        {u.dossierId ? (
                          <Link
                            className="btn btn-sm sehily-btn-primary"
                            to={`/app/admin/dossiers?dossier=${u.dossierId}`}
                          >
                            Voir dossier
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!pagedUsers.length ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">
                      Aucun utilisateur disponible
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <small className="text-muted">Page {currentPage}/{totalPages}</small>
            <div className="btn-group btn-group-sm">
              <button className="btn sehily-btn-secondary" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Précédent
              </button>
              <button className="btn sehily-btn-secondary" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Suivant
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-lg-5">
        <form className="sehily-surface p-3 d-grid gap-3 mb-3" onSubmit={onCreate}>
          <div className="fw-bold">Créer étudiant</div>
          <input
            className="form-control"
            type="email"
            placeholder="email@domaine.mr"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            required
          />
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="Prénom"
                value={draft.first_name}
                onChange={(e) => setDraft((d) => ({ ...d, first_name: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="Nom"
                value={draft.last_name}
                onChange={(e) => setDraft((d) => ({ ...d, last_name: e.target.value }))}
              />
            </div>
          </div>
          <input
            className="form-control"
            placeholder="Matricule"
            value={draft.matricule}
            onChange={(e) => setDraft((d) => ({ ...d, matricule: e.target.value }))}
            required
          />
          <input
            className="form-control"
            placeholder="Établissement"
            value={draft.etablissement}
            onChange={(e) => setDraft((d) => ({ ...d, etablissement: e.target.value }))}
            required
          />
          <input
            className="form-control"
            placeholder="Filière"
            value={draft.filiere}
            onChange={(e) => setDraft((d) => ({ ...d, filiere: e.target.value }))}
            required
          />
          <select
            className="form-select"
            value={draft.wilaya}
            onChange={(e) => setDraft((d) => ({ ...d, wilaya: e.target.value }))}
          >
            <option value="">Wilaya (optionnel)</option>
            {MAURITANIA_WILAYAS.map((wilaya) => (
              <option key={wilaya} value={wilaya}>{wilaya}</option>
            ))}
          </select>
          <button className="btn sehily-btn-primary d-flex align-items-center justify-content-center gap-2" type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
            Ajouter
          </button>
          {createdAccount ? (
            <div className="alert alert-success mb-0 py-2">
              <div className="fw-semibold">Compte créé: {createdAccount.email}</div>
              <div>
                Mot de passe temporaire:{" "}
                <code>{createdAccount.temporary_password || "N/A"}</code>
              </div>
              <div>
                Email de confirmation: {createdAccount.email_sent ? "envoyé" : "non envoyé"}
                {!createdAccount.email_sent && createdAccount.email_error ? ` (${createdAccount.email_error})` : ""}
              </div>
            </div>
          ) : null}
        </form>

        <div className="sehily-surface p-3 d-grid gap-3">
          <div className="fw-bold">Import CSV (CNOU)</div>
          <div className="small text-muted">
            Format attendu : <code>email</code>, <code>matricule</code>, <code>etablissement</code>, <code>filiere</code> (+ optionnel <code>wilaya</code>).
          </div>
          <input
            className="form-control"
            type="file"
            accept=".csv,text/csv"
            disabled={importMutation.isPending}
            onChange={(e) => onImportCsv(e.target.files?.[0])}
          />
          {importMutation.isPending ? (
            <div className="d-flex align-items-center gap-2 small text-muted">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              Import en cours...
            </div>
          ) : null}
          {importFeedback ? <div className="alert alert-info mb-0 py-2">{importFeedback}</div> : null}
        </div>
      </div>
    </div>
  );
}

