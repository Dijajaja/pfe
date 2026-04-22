import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-5">
        <h2 className="mb-1">{t("resetPassword")}</h2>
        <p className="text-muted">
          On branchera cet écran quand l’endpoint backend “reset password” sera prêt.
        </p>

        <div className="alert alert-info">
          Pour l’instant, passe par l’admin CNOU pour réinitialiser, ou on l’implémente côté backend.
        </div>

        <Link className="sehily-link" to="/auth/login">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

