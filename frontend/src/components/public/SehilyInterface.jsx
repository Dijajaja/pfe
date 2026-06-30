import React from "react";
import {
  FileSearch,
  User,
  ArrowRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  Star,
  Info,
  LayoutGrid,
  HelpCircle,
  Headset,
  Mail,
  GraduationCap,
  Building2,
} from "lucide-react";

const FEATURES = [
  { icon: Clock, label: "Gain de temps", sub: "Moins de déplacements" },
  { icon: ShieldCheck, label: "Sécurité", sub: "Données protégées" },
  { icon: TrendingUp, label: "Suivi", sub: "En temps réel" },
];

const FOOTER_LINKS = [
  { icon: Info, label: "À propos" },
  { icon: LayoutGrid, label: "Fonctionnalités" },
  { icon: HelpCircle, label: "FAQ" },
  { icon: Headset, label: "Aide" },
  { icon: Mail, label: "Contact" },
];

const LEGAL_LINKS = ["Mentions légales", "Politique de confidentialité", "Contact"];

const SehilyInterface = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f6] via-white to-[#e6f4f1] font-sans text-slate-800 pb-8">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[#059669]/8 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-[#064E3B]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md">
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B] shadow-lg shadow-emerald-900/20">
              <span className="font-serif text-xl font-bold text-white">S</span>
              <GraduationCap
                className="absolute -top-2.5 left-1/2 h-4 w-4 -translate-x-1/2 text-[#059669]"
                strokeWidth={2.5}
              />
            </div>
            <span className="text-xl font-bold tracking-[0.12em] text-[#064E3B]">SEHILY</span>
          </div>

          <div className="flex rounded-full border border-slate-200/80 bg-white p-1 shadow-sm">
            <button
              type="button"
              className="rounded-full bg-[#064E3B] px-4 py-1.5 text-xs font-bold text-white transition-all"
            >
              FR
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-400 transition-all hover:text-slate-600"
            >
              AR
            </button>
          </div>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="relative overflow-hidden px-6 pb-6 pt-2" id="home">
          <div className="relative z-10 max-w-[68%]">
            <h1 className="mb-3 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-[#064E3B]">
              Votre bourse,{" "}
              <span className="block font-semibold italic text-[#059669]">notre engagement</span>
            </h1>

            <div className="mb-5 h-1 w-12 rounded-full bg-[#059669]" />

            <p className="text-sm leading-relaxed text-slate-500">
              Une plateforme digitale moderne pour simplifier vos démarches et vous accompagner à
              chaque étape du succès universitaire.
            </p>
          </div>

          {/* Graduation cap illustration */}
          <div
            className="pointer-events-none absolute -right-2 top-0 z-0 h-44 w-44"
            aria-hidden="true"
          >
            <div className="absolute bottom-2 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_12px_40px_-12px_rgba(6,78,59,0.35)]">
              <GraduationCap
                className="h-10 w-10 -rotate-12 text-[#064E3B]"
                strokeWidth={1.5}
              />
            </div>
            <div className="absolute right-10 top-8 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-white shadow-lg">
              <ShieldCheck className="h-5 w-5 text-[#059669]" strokeWidth={2.5} />
            </div>
          </div>
        </section>

        {/* --- MAIN CARD (Action) --- */}
        <section className="mb-5 px-6">
          <div className="rounded-[40px] border border-white/50 bg-white/80 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-md">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                <ShieldCheck className="h-7 w-7 text-[#064E3B]" strokeWidth={2} />
              </div>
              <div className="pt-0.5">
                <h2 className="text-lg font-bold leading-tight text-slate-800">
                  Vérifiez votre éligibilité
                </h2>
                <p className="mt-1 text-sm text-slate-400">C&apos;est rapide, gratuit et sécurisé.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl bg-[#064E3B] px-5 py-4 text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-[#043327] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <FileSearch className="h-5 w-5 opacity-90" strokeWidth={2} />
                  <span className="font-semibold">Vérifier mon éligibilité</span>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-slate-400" strokeWidth={2} />
                  <span className="font-semibold">Se connecter</span>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        {/* --- FEATURES --- */}
        <section className="mb-5 px-6">
          <div className="grid grid-cols-3 gap-2 rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm">
            {FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="px-1 text-center">
                <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#064E3B]">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <p className="mb-0.5 text-[11px] font-bold leading-tight text-slate-800">{label}</p>
                <p className="text-[10px] leading-snug text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- OFFICIAL BADGE --- */}
        <section className="mb-8 px-6">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/40 p-5 shadow-sm">
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#064E3B] text-white shadow-inner">
                <Star className="h-7 w-7 fill-white" strokeWidth={0} />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-snug text-slate-800">
                  Plateforme officielle de gestion des bourses universitaires en Mauritanie.
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#059669]">
                  Simplifier, sécuriser, accompagner.
                </p>
              </div>
            </div>

            <Building2
              className="pointer-events-none absolute -bottom-2 right-2 h-20 w-20 text-[#064E3B]/10"
              strokeWidth={1}
              aria-hidden="true"
            />
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-slate-100 px-6 pt-7" id="contact">
          <div className="mb-8 grid grid-cols-5 gap-1">
            {FOOTER_LINKS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="group flex flex-col items-center gap-1.5 rounded-xl py-1 transition-colors"
              >
                <Icon
                  size={17}
                  strokeWidth={1.75}
                  className="text-slate-400 transition-colors group-hover:text-[#064E3B]"
                />
                <span className="text-[10px] font-medium leading-none text-slate-500 group-hover:text-[#064E3B]">
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3 text-center">
            <p className="text-[11px] text-slate-400">© 2026 SEHILY • Tous droits réservés.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-semibold text-[#059669]/80">
              {LEGAL_LINKS.map((link) => (
                <a key={link} href="#" className="transition-colors hover:text-[#064E3B]">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SehilyInterface;
