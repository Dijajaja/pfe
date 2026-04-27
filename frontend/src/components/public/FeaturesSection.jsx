import { FiGlobe, FiMapPin, FiShield, FiZap } from "react-icons/fi";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

export function FeaturesSection() {
  const { t } = useTranslation();
  const features = [
    { icon: FiZap, title: t("featureFastTitle"), text: t("featureFastText") },
    { icon: FiShield, title: t("featureSafeTitle"), text: t("featureSafeText") },
    { icon: FiMapPin, title: t("featureTransparentTitle"), text: t("featureTransparentText") },
    { icon: FiGlobe, title: t("featureAccessibleTitle"), text: t("featureAccessibleText") },
  ];
  const bullets = [t("featureBullet1"), t("featureBullet2"), t("featureBullet3")];

  return (
    <section id="about" className="py-24 bg-slate-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="section-title text-3xl md:text-5xl leading-tight">
              {t("featuresTitlePrefix")} <span className="text-primary italic">Sehily</span> ?
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              {t("featuresLead")}
            </p>

            <div className="space-y-6">
              {bullets.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiShield size={14} />
                  </div>
                  <span className="font-semibold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Icon size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{feature.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
