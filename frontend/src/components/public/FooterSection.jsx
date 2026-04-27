import logoWeb from "../../assets/logo-web.png";
import { useTranslation } from "react-i18next";

export function FooterSection() {
  const { t } = useTranslation();
  const baseLinkColor = "#9FE1CB";
  const hoverLinkColor = "#C9614A";
  const footerLinkStyle = { color: baseLinkColor, transition: "color 220ms ease" };

  function onFooterLinkEnter(e) {
    e.currentTarget.style.color = hoverLinkColor;
  }

  function onFooterLinkLeave(e) {
    e.currentTarget.style.color = baseLinkColor;
  }

  return (
    <footer id="contact" className="pt-14 md:pt-20 pb-8 md:pb-10" style={{ backgroundColor: "#2E7D72", color: "#FFFFFF" }}>
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-16">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
              <img src={logoWeb} alt="SEHILY" className="h-8 w-auto" />
              
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9FE1CB" }}>
              {t("footerLead")}
            </p>
          </div>

          <div className="text-center md:text-left">
            <h4 className="font-bold mb-4 md:mb-6">{t("footerUsefulLinks")}</h4>
            <ul className="space-y-3 md:space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
              {[t("navHome"), t("navAbout"), t("navHowItWorks"), t("navFaq")].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="no-underline"
                    style={footerLinkStyle}
                    onMouseEnter={onFooterLinkEnter}
                    onMouseLeave={onFooterLinkLeave}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="font-bold mb-4 md:mb-6">{t("footerSupport")}</h4>
            <ul className="space-y-3 md:space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
              {[t("footerHelpCenter"), t("footerContactUs"), t("footerLegal"), t("footerPrivacy")].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="no-underline"
                    style={footerLinkStyle}
                    onMouseEnter={onFooterLinkEnter}
                    onMouseLeave={onFooterLinkLeave}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="font-bold mb-4 md:mb-6">{t("navContact")}</h4>
            <ul className="space-y-3 md:space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">Email</span>
                <a
                  href="mailto:contact@sehily.mr"
                  className="no-underline"
                  style={footerLinkStyle}
                  onMouseEnter={onFooterLinkEnter}
                  onMouseLeave={onFooterLinkLeave}
                >
                  contact@sehily.mr
                </a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">{t("footerPhone")}</span>
                <a
                  href="tel:+22245253061"
                  className="no-underline"
                  style={footerLinkStyle}
                  onMouseEnter={onFooterLinkEnter}
                  onMouseLeave={onFooterLinkLeave}
                >
                  +222 45 25 30 61
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 md:pt-10 flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 text-[11px] md:text-xs font-medium tracking-wide uppercase text-center sm:text-left"
          style={{ borderTop: "1px solid #1B4D4A", color: "#9FE1CB" }}
        >
          <p>{t("footerRights")}</p>
          <p>{t("footerMission")}</p>
        </div>
      </div>
    </footer>
  );
}

