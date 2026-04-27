import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiShield, FiZap, FiLock, FiBell } from "react-icons/fi";
import { motion as Motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { t } = useTranslation();
  const kpis = [
    { icon: FiZap, title: t("heroKpiTimeTitle"), sub: t("heroKpiTimeSub") },
    { icon: FiLock, title: t("heroKpiSecureTitle"), sub: t("heroKpiSecureSub") },
    { icon: FiBell, title: t("heroKpiNotifTitle"), sub: t("heroKpiNotifSub") },
  ];

  return (
    <section className="relative pt-36 pb-20 overflow-hidden" id="home">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[28px] px-6 py-8 md:px-10 md:py-10 shadow-[0_20px_50px_-25px_rgba(7,42,40,0.55)]" style={{ backgroundColor: "#1B4D4A" }}>
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border" style={{ backgroundColor: "rgba(255,255,255,0.14)", color: "#FFFFFF", borderColor: "rgba(255,255,255,0.24)" }}>
              <FiShield size={14} />
              {t("heroBadgeNew")}
            </span>

            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white leading-[1.1] mb-6">
              {t("heroTitleLine1")} <br />
              <span style={{ color: "#9FE1CB" }} className="italic">{t("heroTitleLine2")}</span>
            </h1>

            <p className="text-xl leading-relaxed max-w-xl mb-8" style={{ color: "rgba(255,255,255,0.82)" }}>
              {t("heroLead")}
            </p>

            <div className="flex items-center gap-4 p-4 rounded-2xl border shadow-[0_14px_35px_-20px_rgba(2,8,23,0.35)] mb-8 max-w-md" style={{ backgroundColor: "rgba(255,255,255,0.96)", borderColor: "rgba(255,255,255,0.35)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#E8F2EF", color: "#1B4D4A" }}>
                <FiCheckCircle size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{t("heroCardTitle")}</p>
                <p className="text-sm text-slate-500">{t("heroCardSubtitle")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/eligibilite"
                className="group px-8 no-underline inline-flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: "#C9614A" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#b4523d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#C9614A";
                }}
              >
                {t("ctaCheck")}
                <div className="group-hover:translate-x-1 transition-transform">
                  <FiArrowRight size={18} />
                </div>
              </Link>
              <Link to="/auth/login" className="px-8 no-underline inline-flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all duration-300" style={{ border: "1px solid #2E7D72", color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.04)" }}>
                {t("ctaLogin")}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {kpis.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2" style={{ color: "#9FE1CB" }}>
                    <item.icon size={16} />
                    <span className="font-bold text-white text-sm whitespace-nowrap">{item.title}</span>
                  </div>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{item.sub}</span>
                </div>
              ))}
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto w-full max-w-[360px] aspect-[9/16] bg-slate-950 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden shadow-primary/20 ring-1 ring-primary/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-10" />
              <div className="h-full bg-slate-50 p-6 pt-12 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-400">{t("heroHello")}</p>
                    <p className="font-bold text-slate-900">Diary Ba</p>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t("heroStatusTitle")}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{t("heroStatusValue")}</p>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold">{t("heroStatusActive")}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">{t("heroProgressTitle")}</p>
                  <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={`h-1.5 rounded-full flex-1 ${s <= 2 ? "bg-primary" : "bg-slate-100"}`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-primary font-bold mt-2 text-right">{t("heroProgressLabel")}</p>
                </div>

                <div className="mt-auto">
                  <div className="h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs mb-2">
                    {t("heroDeposit")}
                  </div>
                  <div className="h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {t("heroPayments")}
                  </div>
                </div>
              </div>
            </div>

            <Motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-10 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FiZap size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{t("heroSpeedTitle")}</p>
                <p className="text-[10px] text-slate-400">{t("heroSpeedSub")}</p>
              </div>
            </Motion.div>

            <Motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
              className="absolute top-1/2 -right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <FiShield size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{t("heroTrustTitle")}</p>
                <p className="text-[10px] text-slate-400">{t("heroTrustSub")}</p>
              </div>
            </Motion.div>
          </Motion.div>
        </div>
      </div>
    </section>
  );
}
