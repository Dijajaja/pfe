import { FiFileText, FiSmile, FiUsers, FiSend } from "react-icons/fi";
import { motion } from "motion/react";

const stats = [
  { icon: FiUsers, value: "10 000+", label: "Étudiants" },
  { icon: FiFileText, value: "25 000+", label: "Dossiers" },
  { icon: FiSmile, value: "95%", label: "Satisfaction" },
  { icon: FiSend, value: "-80%", label: "Déplacements" },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-primary">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-5"
              >
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 backdrop-blur-sm">
                  <Icon size={28} />
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-white mb-0.5">{stat.value}</div>
                  <div className="text-white/60 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
