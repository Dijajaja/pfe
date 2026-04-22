export function GuidePfePage() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <h1 className="h4 mb-1">Guide PFE — Intégrations & flux métier</h1>
        <p className="text-muted mb-0">
          Version projet académique : simulation des intégrations externes, logique métier codée dans ton backend Django.
        </p>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <h2 className="h6 mb-3">1) Ce qu’il faut vraiment pour ton PFE</h2>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Intégration</th>
                  <th>Ce que tu fais pour le PFE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>MERSE</td>
                  <td>Tu codes les règles d’éligibilité côté Django (simulation locale).</td>
                </tr>
                <tr>
                  <td>BariCash / Mauriposte</td>
                  <td>Tu simules la confirmation de paiement via endpoint partenaire.</td>
                </tr>
                <tr>
                  <td>Données CNOU</td>
                  <td>Tu importes un fichier CSV/Excel (fixtures ou module d’import).</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="small text-muted mt-3">
            Pour une version officielle, il faut ensuite les APIs réelles + accords institutionnels.
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-6">
        <div className="sehily-surface p-3 h-100">
          <h2 className="h6 mb-3">2) Flux logique (indirect via backend)</h2>
          <pre className="sehily-code mb-0">{`CNOU valide le dossier
↓
Django génère un ordre de paiement
↓
Partenaire reçoit l'ordre
↓
Partenaire confirme le paiement
↓
Étudiant reçoit la notification`}</pre>
        </div>
      </div>

      <div className="col-12 col-xl-6">
        <div className="sehily-surface p-3 h-100">
          <h2 className="h6 mb-3">3) Règles d’éligibilité dans l’app (sécurité)</h2>
          <pre className="sehily-code mb-0">{`def est_eligible(etudiant):
    age = calculer_age(etudiant.date_naissance)

    if age >= 24:
        return False, "Vous avez dépassé la limite d'âge de 24 ans"

    if etudiant.ville_bac != "Nouakchott":
        return True, "Éligible - Bac hors Nouakchott"

    if etudiant.niveau == "L3":
        return True, "Éligible - Niveau L3"

    return False, "Non éligible - Bac Nouakchott, attendez le L3"`}</pre>
        </div>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <h2 className="h6 mb-3">4) Séparation des accès (une base partagée)</h2>
          <pre className="sehily-code mb-0">{`Group: "admin_cnou"   -> accès complet dossiers + validation
Group: "partenaire"   -> accès dossiers validés + confirmation paiement
Group: "etudiant"     -> accès à son propre dossier + suivi`}</pre>
        </div>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <h2 className="h6 mb-3">5) Problème CNOU (clé USB) : solution d’import</h2>
          <pre className="sehily-code mb-3">{`Université exporte les données (CSV/Excel)
↓
Admin CNOU upload le fichier dans l'app
↓
Django lit et importe automatiquement les données`}</pre>
          <pre className="sehily-code mb-0">{`import pandas as pd

def importer_etudiants(fichier_csv):
    df = pd.read_csv(fichier_csv)
    for _, row in df.iterrows():
        Etudiant.objects.create(
            nom=row["nom"],
            prenom=row["prenom"],
            niveau=row["niveau"],
            universite=row["universite"],
        )`}</pre>
        </div>
      </div>

      <div className="col-12">
        <div className="sehily-surface p-3">
          <h2 className="h6 mb-3">6) API Django (backend)</h2>
          <pre className="sehily-code mb-0">{`POST   /api/v1/auth/inscription/           -> inscription
POST   /api/v1/auth/token/                 -> connexion (JWT)
POST   /api/v1/auth/token/refresh/         -> refresh token
GET    /api/v1/dossiers/                   -> liste/filtre dossiers
POST   /api/v1/dossiers/                   -> soumettre une demande
PATCH  /api/v1/dossiers/{id}/              -> accepter/rejeter (admin) ou soumettre (étudiant)
POST   /api/v1/documents/                  -> upload document
GET    /api/v1/me/paiements/               -> paiements étudiant
GET    /api/v1/admin/reports/dashboard/    -> dashboard CNOU
GET    /api/v1/admin/paiements/            -> paiements (CNOU)
GET    /api/v1/partner/listes/{reference}/ -> dossiers validés (partenaire)
POST   /api/v1/partner/paiements/confirmer/-> confirmation paiement`}</pre>
        </div>
      </div>
    </div>
  );
}

