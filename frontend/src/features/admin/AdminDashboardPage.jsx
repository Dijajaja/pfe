import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { adminApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { getApiErrorMessage } from "../../lib/apiError";

function KpiCard({ label, value }) {
  return (
    <div className="sehily-surface p-3 h-100">
      <div className="text-muted small">{label}</div>
      <div className="h4 mb-0">{value.toLocaleString()}</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });
  const dossiersQuery = useQuery({
    queryKey: ["admin", "dossiers", "recent"],
    queryFn: () => adminApi.listDossiers(),
  });

  if (isLoading) return <LoadingSkeleton lines={8} />;
  if (error) return <div className="alert alert-danger">{getApiErrorMessage(error, "Impossible de charger le dashboard admin.")}</div>;

  const dossiers = data?.dossiers || {};
  const paiements = data?.paiements || {};
  const recentDossiers = (dossiersQuery.data || []).slice(0, 6);
  const total = Math.max(1, dossiers.total || 0);
  const soumisPct = Math.round(((dossiers.SOUMIS || 0) / total) * 100);
  const validesPct = Math.round(((dossiers.VALIDE || 0) / total) * 100);
  const rejetesPct = Math.round(((dossiers.REJETE || 0) / total) * 100);
  const chartStyle = {
    background: `conic-gradient(
      #198754 0 ${validesPct}%,
      #ffc107 ${validesPct}% ${validesPct + soumisPct}%,
      #dc3545 ${validesPct + soumisPct}% ${validesPct + soumisPct + rejetesPct}%,
      #dee2e6 ${validesPct + soumisPct + rejetesPct}% 100%
    )`,
  };

  return (
    <div className="row g-3">
      <div className="col-12">
        <h1 className="h4 mb-1">Admin — Dashboard KPIs</h1>
        <div className="text-muted">Vue synthétique dossiers/paiements.</div>
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <KpiCard label="Total dossiers" value={dossiers.total || 0} />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <KpiCard label="Soumis" value={dossiers.SOUMIS || 0} />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <KpiCard label="Validés" value={dossiers.VALIDE || 0} />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <KpiCard label="Rejetés" value={dossiers.REJETE || 0} />
      </div>
      <div className="col-12 col-md-6 col-xl-3">
        <KpiCard label="Paiements effectués" value={paiements.EFFECTUE || 0} />
      </div>
      <div className="col-12">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-3">Graphique réel (répartition dossiers)</div>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-4">
              <div className="cnou-donut mx-auto" style={chartStyle}>
                <div className="cnou-donut-inner">{dossiers.total || 0}</div>
              </div>
            </div>
            <div className="col-12 col-md-8">
              <div className="mb-2 d-flex justify-content-between small">
                <span>Validés</span>
                <span>{validesPct}%</span>
              </div>
              <div className="progress mb-3" style={{ height: 10 }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${validesPct}%` }} />
              </div>

              <div className="mb-2 d-flex justify-content-between small">
                <span>Soumis / en attente</span>
                <span>{soumisPct}%</span>
              </div>
              <div className="progress mb-3" style={{ height: 10 }}>
                <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${soumisPct}%` }} />
              </div>

              <div className="mb-2 d-flex justify-content-between small">
                <span>Rejetés</span>
                <span>{rejetesPct}%</span>
              </div>
              <div className="progress" style={{ height: 10 }}>
                <div className="progress-bar bg-danger" role="progressbar" style={{ width: `${rejetesPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-8">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Liste dossiers récents</div>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Étudiant</th>
                  <th>Statut</th>
                  <th>Année</th>
                </tr>
              </thead>
              <tbody>
                {recentDossiers.map((d) => (
                  <tr key={d.id}>
                    <td>DOS-{String(d.id).padStart(6, "0")}</td>
                    <td>{d.etudiant || d.etudiant_email || `#${d.etudiant}`}</td>
                    <td>{d.statut}</td>
                    <td>{d.annee_universitaire}</td>
                  </tr>
                ))}
                {!recentDossiers.length ? (
                  <tr>
                    <td colSpan={4} className="text-muted">
                      Aucun dossier récent.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-4">
        <div className="sehily-surface p-3">
          <div className="fw-bold mb-2">Actions rapides</div>
          <div className="d-grid gap-2">
            <Link className="btn sehily-btn-primary" to="/app/admin/dossiers">
              Traiter les dossiers
            </Link>
            <Link className="btn sehily-btn-secondary" to="/app/admin/users">
              Gérer les étudiants
            </Link>
            <Link className="btn sehily-btn-accent" to="/app/admin/exports">
              Export paiements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

