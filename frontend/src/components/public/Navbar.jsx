import { Link } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import logoWeb from "../../assets/logo-web.png";
import { setLanguage } from "../../i18n/setup";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Accueil", href: "/#home" },
    { name: "Comment ça marche", href: "/#how-it-works" },
    { name: "À propos", href: "/#about" },
    { name: "FAQ", href: "/#faq" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <nav
      style={{ position: "fixed", top: 0, left: 0, right: 0 }}
      className={`z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-4"}`}
    >
      <div className="container-custom">
        <div className={`flex items-center justify-between rounded-2xl border px-4 md:px-5 transition-all duration-300 ${scrolled ? "bg-white/92 backdrop-blur-md border-slate-200 shadow-[0_14px_40px_-20px_rgba(2,8,23,0.35)]" : "bg-white/80 backdrop-blur-sm border-slate-100 shadow-[0_8px_24px_-16px_rgba(2,8,23,0.25)]"}`}>
          <Link to="/" className="flex items-center gap-2 no-underline py-2">
            <img src={logoWeb} alt="SEHILY" className="h-12 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-sm font-semibold !text-slate-700 visited:!text-slate-700 hover:!text-primary transition-colors no-underline after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-primary after:rounded-full hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
            <div className="flex items-center gap-1 border border-slate-200 rounded-full px-1.5 py-1 bg-white">
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded-full transition-colors ${i18n.language === "fr" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-500"}`}
                onClick={() => setLanguage("fr")}
              >
                FR
              </button>
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded-full transition-colors ${i18n.language === "ar" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-500"}`}
                onClick={() => setLanguage("ar")}
              >
                AR
              </button>
            </div>
            <Link to="/auth/login" className="text-sm font-semibold !text-slate-900 visited:!text-slate-900 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors no-underline">
              Connexion
            </Link>
            <Link to="/eligibilite" className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2 no-underline">
              Vérifier mon éligibilité <FiArrowRight size={16} />
            </Link>
          </div>

          <button className="md:hidden p-2 text-slate-900" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="container-custom py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium !text-slate-900 visited:!text-slate-900 no-underline"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-slate-100" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-sm px-3 py-1.5 rounded-lg border ${i18n.language === "fr" ? "bg-slate-100 border-slate-200 text-slate-900 font-semibold" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setLanguage("fr")}
                >
                  FR
                </button>
                <button
                  type="button"
                  className={`text-sm px-3 py-1.5 rounded-lg border ${i18n.language === "ar" ? "bg-slate-100 border-slate-200 text-slate-900 font-semibold" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setLanguage("ar")}
                >
                  AR
                </button>
              </div>
              <Link to="/auth/login" className="text-lg font-medium !text-slate-900 visited:!text-slate-900 no-underline">Connexion</Link>
              <Link to="/eligibilite" className="bg-primary text-white text-center py-4 rounded-xl font-bold no-underline">
                Vérifier mon éligibilité
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

