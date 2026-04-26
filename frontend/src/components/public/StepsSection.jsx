import { FiCreditCard, FiFileText, FiSearch, FiUserPlus, FiHome } from "react-icons/fi";
import { motion } from "motion/react";

const steps = [
  { icon: FiSearch, title: "vérification éligibilité", text: "Entrez vos informations pour vérifier si vous êtes éligible à la bourse." },
  { icon: FiUserPlus, title: "Créer un compte", text: "Si vous êtes éligible, créez votre compte en quelques minutes." },
  { icon: FiFileText, title: "Dossier Déposer", text: "Remplissez le formulaire et téléversez vos pièces justificatives." },
  { icon: FiHome, title: "Traitement", text: "Votre dossier est étudié et validé par les équipes du CNOU." },
  { icon: FiCreditCard, title: "paiement", text: "Une fois validé, le paiement est effectué par notre partenaire." },
];

export function StepsSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="container-custom">
        <div className="text-center mb-20">
          <h2 className="section-title-center text-3xl md:text-4xl">Comment ça marche ?</h2>
          <div className="text-slate-400 font-medium tracking-wide">Un processus 100% digitalisé</div>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -translate-y-1/2 -z-0 hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] shadow-[0_15px_45px_-15px_rgba(0,0,0,0.08)] border border-slate-50 flex flex-col items-center text-center relative group hover:shadow-2xl transition-all duration-500"
                >
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#004d40] rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-lg z-20">
                    {index + 1}
                  </div>

                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 mb-8 mt-2 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                    <Icon size={32} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-4 capitalize leading-tight">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {step.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
