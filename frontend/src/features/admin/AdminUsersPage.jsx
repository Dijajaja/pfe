import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { adminUsers as usersSeed } from "../data/mockData";
import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";

export function AdminUsersPage() {
  const [users, setUsers] = useState(usersSeed);
  const [draft, setDraft] = useState({ email: "", role: "ETUDIANT" });
  const [importFeedback, setImportFeedback] = useState("");
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
  });

  useEffect(() => {
    const data = usersQuery.data;
    if (Array.isArray(data) && data.length) setUsers(data);
  }, [usersQuery.data]);

  function toggleActive(id) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u)));
  }

  function onCreate(e) {
    e.preventDefault();
    if (!draft.email.trim()) return;
    setUsers((prev) => [...prev, { id: Date.now(), email: draft.email, role: draft.role, actif: true }]);
    setDraft({ email: "", role: "ETUDIANT" });
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
  }

  if (usersQuery.isLoading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Utilisateurs</h1>
        <div className="text-muted">Liste étudiants inscrits + CRUD simple + activation/désactivation.</div>
        <div className="alert alert-warning mt-2 mb-0">
          Endpoint backend users admin non exposé pour l’instant : cette page reste en mode local UI.
        </div>
      </div>

      <div className="col-12 col-lg-7">
        <div className="sehily-surface p-3">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.actif ? "Oui" : "Non"}</td>
                    <td>
                      <button className="btn btn-sm sehily-btn-secondary" onClick={() => toggleActive(u.id)}>
                        {u.actif ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            onChange={(e) => onImportCsv(e.target.files?.[0])}
          />
          {importFeedback ? <div className="alert alert-info mb-0 py-2">{importFeedback}</div> : null}
        </div>
      </div>
    </div>
  );
}

