import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from "react-icons/fi";
import logoWeb from "../../assets/logo-web.png";

export function FooterSection() {
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
    <footer id="contact" className="pt-20 pb-10" style={{ backgroundColor: "#2E7D72", color: "#FFFFFF" }}>
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src={logoWeb} alt="SEHILY" className="h-8 w-auto" />
              
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9FE1CB" }}>
              Plateforme officielle de gestion des bourses universitaires en Mauritanie. Simplifier, sécuriser, accompagner.
            </p>
            <div className="flex gap-4">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors no-underline"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#FFFFFF", border: "1px solid #1B4D4A" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#C9614A";
                    e.currentTarget.style.borderColor = "#C9614A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "#1B4D4A";
                  }}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Liens utiles</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
              {["Accueil", "À propos", "Comment ça marche", "FAQ"].map((item) => (
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

          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
              {["Centre d'aide", "Nous contacter", "Mentions légales", "Confidentialité"].map((item) => (
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

          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm" style={{ color: "#9FE1CB" }}>
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
                <span className="text-white font-medium">Téléphone</span>
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
          className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium tracking-wide uppercase"
          style={{ borderTop: "1px solid #1B4D4A", color: "#9FE1CB" }}
        >
          <p>© 2026 Sehily - Tous droits réservés.</p>
          <p>Développé pour la réussite de nos étudiants.</p>
        </div>
      </div>
    </footer>
  );
}

