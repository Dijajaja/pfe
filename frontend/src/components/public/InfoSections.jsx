import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function StatusGuideSection() {
  const { t } = useTranslation();
  const guides = [
    { status: t("badgeEligible"), color: "emerald", text: t("statusGuideEligibleText") },
    { status: t("badgePending"), color: "amber", text: t("statusGuidePendingText") },
    { status: t("eligibleNo"), color: "rose", text: t("statusGuideRejectedText") },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container-custom">
        <div className="mb-16 text-center">
          <h2 className="section-title-center text-3xl md:text-4xl text-center">{t("statusGuideTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {guides.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50"
            >
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${item.color === "emerald" ? "bg-primary/10 text-primary" : item.color === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                {item.status}
              </span>
              <p className="text-slate-600 leading-relaxed text-sm">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const { t } = useTranslation();
  const faqs = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
  ];

  return (
    <section id="faq" className="py-24 bg-white overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-6">
            <h2 className="section-title text-3xl md:text-4xl mb-16">{t("faqTitle")}</h2>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-2xl border border-slate-100 hover:border-primary/20 transition-all shadow-sm">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-slate-900 group-open:text-primary transition-colors">
                    <span className="pr-4">{faq.q}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="faq-help-circles aspect-square max-w-[500px] mx-auto">
              <div className="circle-decor-1" />
              <div className="circle-decor-2" />

              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="circle-blob top-[15%] left-[10%] bg-primary"
              />
              <motion.div
                animate={{ scale: [1, 0.9, 1] }}
                transition={{ duration: 7, repeat: Infinity, delay: 2 }}
                className="circle-blob bottom-[10%] right-[5%] bg-[#004d40] w-12 h-12"
              />

              <div className="relative bg-white p-12 rounded-full shadow-2xl border border-slate-100 text-center flex flex-col items-center max-w-[80%] aspect-square justify-center z-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 border border-primary/20 shadow-inner">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">{t("faqHelpTitle")}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-[240px]">
                  {t("faqHelpText")}
                </p>
                <button className="bg-[#004d40] hover:bg-[#003d33] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
                  {t("faqHelpCta")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
