import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from "react-icons/fi";
import logoWeb from "../../assets/logo-web.png";

export function FooterSection() {
  return (
    <footer id="contact" className="bg-slate-900 text-white pt-20 pb-10">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src={logoWeb} alt="SEHILY" className="h-8 w-auto" />
              
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Plateforme officielle de gestion des bourses universitaires en Mauritanie. Simplifier, sécuriser, accompagner.
            </p>
            <div className="flex gap-4">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary transition-colors !text-white/60 visited:!text-white/60 hover:!text-white no-underline">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6">Liens utiles</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {["Accueil", "À propos", "Comment ça marche", "FAQ"].map((item) => (
                <li key={item}><a href="#" className="!text-slate-400 visited:!text-slate-400 hover:!text-primary transition-colors no-underline">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {["Centre d'aide", "Nous contacter", "Mentions légales", "Confidentialité"].map((item) => (
                <li key={item}><a href="#" className="!text-slate-400 visited:!text-slate-400 hover:!text-primary transition-colors no-underline">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">Email</span>
                <a href="mailto:contact@sehily.mr" className="!text-slate-400 visited:!text-slate-400 hover:!text-primary transition-colors no-underline">contact@sehily.mr</a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-white font-medium">Téléphone</span>
                <a href="tel:+22245253061" className="!text-slate-400 visited:!text-slate-400 hover:!text-primary transition-colors no-underline">+222 45 25 30 61</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium tracking-wide uppercase">
          <p>© 2026 Sehily - Tous droits réservés.</p>
          <p>Développé pour la réussite de nos étudiants.</p>
        </div>
      </div>
    </footer>
  );
}

