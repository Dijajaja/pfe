import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminUsers as usersSeed } from "../data/mockData";
import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";

const PAGE_SIZE = 8;

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { pushError, pushSuccess, pushInfo } = useAppToast();
  const [users, setUsers] = useState(usersSeed);
  const [draft, setDraft] = useState({ email: "", role: "ETUDIANT" });
  const [importFeedback, setImportFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
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
    if (!draft.email.trim()) {
      pushInfo("L’endpoint création utilisateur n’est pas encore exposé côté backend.");
      return;
    }
    setUsers((prev) => [...prev, { id: Date.now(), email: draft.email, role: draft.role, actif: true }]);
    setDraft({ email: "", role: "ETUDIANT" });
    pushInfo("Création locale ajoutée (endpoint création backend non disponible).");
  }

  function parseCsvText(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((x) => x.trim().toLowerCase());
    const idxEmail = headers.indexOf("email");
    const idxRole = headers.indexOf("role");
    if (idxEmail < 0) throw new Error("Le CSV doit contenir la colonne email.");
    const parsed = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cols = lines[i].split(",").map((x) => x.trim());
      const email = cols[idxEmail];
      if (!email) continue;
      const role = (idxRole >= 0 ? cols[idxRole] : "ETUDIANT") || "ETUDIANT";
      parsed.push({ id: Date.now() + i, email, role, actif: true });
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
  const filteredUsers = users.filter((u) => {
    const searchOk = `${u.email} ${u.role}`.toLowerCase().includes(q);
    const roleOk = roleFilter === "ALL" ? true : u.role === roleFilter;
    const activeOk = activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? u.actif : !u.actif;
    return searchOk && roleOk && activeOk;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Utilisateurs</h1>
        <div className="text-muted">Gestion des utilisateurs, activation/désactivation, import CSV CNOU.</div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="sehily-surface p-3">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <input
              className="form-control form-control-sm"
              placeholder="Rechercher (email, rôle)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select className="form-select form-select-sm" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="ALL">Rôle: Tous</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ETUDIANT">ETUDIANT</option>
              <option value="PARTENAIRE">PARTENAIRE</option>
            </select>
            <select className="form-select form-select-sm" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
              <option value="ALL">État: Tous</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
            </select>
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
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.actif ? "Oui" : "Non"}</td>
                    <td>
                      <button className="btn btn-sm sehily-btn-secondary d-flex align-items-center gap-2" onClick={() => toggleActive(u.id)} disabled={updateUserMutation.isPending}>
                        {updateUserMutation.isPending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : null}
                        {u.actif ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!pagedUsers.length ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
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
          <div className="fw-bold">Créer utilisateur</div>
          <input
            className="form-control"
            type="email"
            placeholder="email@domaine.mr"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            required
          />
          <select
            className="form-select"
            value={draft.role}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
          >
            <option value="ETUDIANT">ETUDIANT</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PARTENAIRE">PARTENAIRE</option>
          </select>
          <button className="btn sehily-btn-primary" type="submit">
            Ajouter
          </button>
        </form>

        <div className="sehily-surface p-3 d-grid gap-3">
          <div className="fw-bold">Import CSV (CNOU)</div>
          <div className="small text-muted">
            Format attendu : colonnes <code>email</code> et optionnellement <code>role</code>.
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

