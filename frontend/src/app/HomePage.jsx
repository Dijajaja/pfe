import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import demarches from "../assets/demarches.png";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-6">
        <h1 className="h3 mb-2">{t("homeTitle")}</h1>
        <p className="text-muted mb-3">{t("homeLead")}</p>

        <ul className="text-muted small mb-3">
          <li>{t("benefit1")}</li>
          <li>{t("benefit2")}</li>
          <li>{t("benefit3")}</li>
        </ul>

        <div className="d-flex gap-2 flex-wrap">
          <span className="sehily-badge sehily-badge--ok">{t("badgeEligible")}</span>
          <span className="sehily-badge sehily-badge--danger">{t("badgeRejected")}</span>
          <span className="sehily-badge sehily-badge--warn">{t("badgePending")}</span>
        </div>

        <hr className="border-opacity-25" />

        <div className="d-flex flex-wrap gap-2">
          <Link className="btn sehily-btn-primary" to="/eligibilite">
            {t("ctaCheck")}
          </Link>
          <Link className="btn sehily-btn-secondary" to="/auth/login">
            {t("ctaLogin")}
          </Link>
          <Link className="btn btn-outline-light" to="/auth/register">
            {t("ctaRegister")}
          </Link>
        </div>
      </div>

      <div className="col-12 col-lg-6">
        <div className="row g-3">
          <div className="col-12">
            <div className="sehily-surface p-3">
              <div className="fw-bold mb-2">Démarches</div>
              <img src={demarches} alt={t("demarchesAlt")} className="img-fluid rounded-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

