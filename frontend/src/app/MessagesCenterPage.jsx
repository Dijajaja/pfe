import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Inbox, ListChecks, MessageSquare } from "lucide-react";

import { useEffectiveRole } from "./session";

export function MessagesCenterPage() {
  const { t } = useTranslation();
  const { role } = useEffectiveRole();

  const subtitle = useMemo(() => {
    if (role === "ETUDIANT") return t("messagesCenterSubtitleStudent");
    if (role === "PARTENAIRE") return t("messagesCenterSubtitlePartner");
    if (role === "ADMIN") return t("messagesCenterSubtitleAdmin");
    return t("messagesCenterSubtitle");
  }, [role, t]);

  return (
    <div className="messages-center-page">
      <header className="mb-4">
        <h1 className="h4 mb-1">{t("messagesCenterTitle")}</h1>
        <p className="text-muted mb-0">{subtitle}</p>
      </header>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="sehily-surface p-4 p-lg-5 messages-center-hero">
            <div className="messages-center-empty-icon" aria-hidden>
              <Inbox size={36} strokeWidth={1.35} />
            </div>
            <h2 className="h5 mt-3 mb-2">{t("messagesCenterEmptyTitle")}</h2>
            <p className="text-muted mb-4" style={{ maxWidth: "36rem" }}>
              {t("messagesCenterEmptyLead")}
            </p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button type="button" className="btn sehily-btn-primary d-inline-flex align-items-center gap-2" disabled aria-describedby="messages-center-cta-help">
                <MessageSquare size={18} aria-hidden />
                {t("messagesCenterCtaNew")}
              </button>
            </div>
            <p id="messages-center-cta-help" className="small text-muted mt-3 mb-0" style={{ maxWidth: "32rem" }}>
              {t("messagesCenterCtaHelp")}
            </p>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="sehily-surface p-4 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <ListChecks className="text-muted" size={20} aria-hidden />
              <span className="fw-semibold">{t("messagesCenterRoadmapTitle")}</span>
            </div>
            <ul className="list-unstyled mb-0 messages-center-roadmap">
              <li>{t("messagesCenterRoadmap1")}</li>
              <li>{t("messagesCenterRoadmap2")}</li>
              <li>{t("messagesCenterRoadmap3")}</li>
            </ul>
            <p className="small text-muted border-top pt-3 mt-3 mb-0">{t("messagesCenterNote")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
