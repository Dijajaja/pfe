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
  const [activeHash, setActiveHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash || "#home" : "#home",
  );
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveHash(window.location.hash || "#home");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navLinks = [
    { name: t("navHome"), href: "/#home" },
    { name: t("navHowItWorks"), href: "/#how-it-works" },
    { name: t("navAbout"), href: "/#about" },
    { name: t("navFaq"), href: "/#faq" },
    { name: t("navContact"), href: "/#contact" },
  ];

  return (
    <nav
      style={{ position: "fixed", top: 0, left: 0, right: 0 }}
      className={`z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-4"}`}
    >
      <div className="container-custom">
        <div className={`flex items-center justify-between rounded-2xl border px-4 md:px-5 transition-all duration-300 ${scrolled ? "backdrop-blur-md shadow-[0_14px_40px_-20px_rgba(2,8,23,0.35)]" : "backdrop-blur-sm shadow-[0_8px_24px_-16px_rgba(2,8,23,0.25)]"}`} style={{ backgroundColor: "#1B4D4A", borderColor: "rgba(255,255,255,0.14)" }}>
          <Link to="/" className="flex items-center gap-2 no-underline py-2">
            <img src={logoWeb} alt="SEHILY" className="h-12 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = activeHash === link.href.replace("/#", "#");
              return (
              <a
                key={link.name}
                href={link.href}
                className={`relative text-sm font-semibold !text-white visited:!text-white transition-colors no-underline after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-[#C9614A] after:transition-all ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}`}
                style={{ color: isActive ? "#C9614A" : "#FFFFFF" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#C9614A";
                  e.currentTarget.style.setProperty("background", "transparent");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isActive ? "#C9614A" : "#FFFFFF";
                }}
              >
                {link.name}
              </a>
              );
            })}
            <div className="flex items-center gap-1 border rounded-full px-1.5 py-1" style={{ borderColor: "rgba(255,255,255,.25)", background: "rgba(255,255,255,.08)" }}>
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded-full transition-colors ${i18n.language === "fr" ? "font-semibold" : ""}`}
                style={i18n.language === "fr" ? { background: "#FFFFFF", color: "#1B4D4A" } : { color: "#FFFFFF" }}
                onClick={() => setLanguage("fr")}
              >
                FR
              </button>
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded-full transition-colors ${i18n.language === "ar" ? "font-semibold" : ""}`}
                style={i18n.language === "ar" ? { background: "#FFFFFF", color: "#1B4D4A" } : { color: "#FFFFFF" }}
                onClick={() => setLanguage("ar")}
              >
                AR
              </button>
            </div>
            <Link to="/auth/login" className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors no-underline !text-white visited:!text-white hover:!text-[#C9614A]">
              {t("navLogin")}
            </Link>
            <Link
              to="/eligibilite"
              className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 no-underline"
              style={{ backgroundColor: "#C9614A" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#b4523d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#C9614A";
              }}
            >
              {t("ctaCheck")} <FiArrowRight size={16} />
            </Link>
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
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
            className="md:hidden border-b overflow-hidden"
            style={{ backgroundColor: "#1B4D4A", borderColor: "rgba(255,255,255,.16)" }}
          >
            <div className="container-custom py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium !text-white visited:!text-white no-underline"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <hr style={{ borderColor: "rgba(255,255,255,.16)" }} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-sm px-3 py-1.5 rounded-lg border ${i18n.language === "fr" ? "font-semibold" : ""}`}
                  style={i18n.language === "fr" ? { background: "#FFFFFF", borderColor: "#FFFFFF", color: "#1B4D4A" } : { borderColor: "rgba(255,255,255,.25)", color: "#FFFFFF" }}
                  onClick={() => setLanguage("fr")}
                >
                  FR
                </button>
                <button
                  type="button"
                  className={`text-sm px-3 py-1.5 rounded-lg border ${i18n.language === "ar" ? "font-semibold" : ""}`}
                  style={i18n.language === "ar" ? { background: "#FFFFFF", borderColor: "#FFFFFF", color: "#1B4D4A" } : { borderColor: "rgba(255,255,255,.25)", color: "#FFFFFF" }}
                  onClick={() => setLanguage("ar")}
                >
                  AR
                </button>
              </div>
              <Link to="/auth/login" className="text-lg font-medium !text-white visited:!text-white no-underline">{t("navLogin")}</Link>
              <Link to="/eligibilite" className="text-white text-center py-4 rounded-xl font-bold no-underline" style={{ backgroundColor: "#C9614A" }}>
                {t("ctaCheck")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

