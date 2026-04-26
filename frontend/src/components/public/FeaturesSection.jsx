import { FiGlobe, FiMapPin, FiShield, FiZap } from "react-icons/fi";
import { motion } from "motion/react";

const features = [
  { icon: FiZap, title: "Plus rapide", text: "Des démarches simplifiées pour un traitement accéléré." },
  { icon: FiShield, title: "Plus sûr", text: "Sécurité et confidentialité de vos données garanties." },
  { icon: FiMapPin, title: "Plus transparent", text: "Suivez l'avancement de votre dossier en temps réel." },
  { icon: FiGlobe, title: "Accessible partout", text: "Utilisez la plateforme depuis tous vos appareils." },
];

export function FeaturesSection() {
  return (
    <section id="about" className="py-24 bg-slate-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="section-title text-3xl md:text-5xl leading-tight">
              Pourquoi choisir <span className="text-primary italic">Sehily</span> ?
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Nous avons repensé la gestion des bourses pour offrir une expérience digitale fluide, éliminant les barrières administratives traditionnelles.
            </p>

            <div className="space-y-6">
              {["Innovation digitale au service de l'éducation", "Traitement automatisé des données", "Accès direct aux partenaires de paiement"].map((item, i) => (
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
