import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      appName: "Sehily",
      tagline: "Gestion des Bourses Universitaires",
      login: "Connexion",
      register: "Inscription",
      resetPassword: "Mot de passe oublié",
      email: "E-mail",
      password: "Mot de passe",
      submit: "Soumettre",
      cancel: "Annuler",
      language: "Langue",
      welcome: "Bienvenue",
      homeTitle: "Plateforme Sehily",
      homeLead:
        "Inscription, dépôt de dossier, suivi et paiements : une expérience simple, moderne et transparente.",
      benefit1: "Moins de déplacements, plus de clarté sur l’avancement",
      benefit2: "Dépôt de pièces et suivi en temps réel",
      benefit3: "Parcours guidé du dépôt jusqu’au paiement",
      ctaCheck: "Vérifier mon éligibilité",
      ctaLogin: "Se connecter",
      ctaRegister: "Créer un compte",
      badgeEligible: "Éligible",
      badgeRejected: "Rejeté",
      badgePending: "En attente",
      demarchesAlt: "Démarches de dépôt de dossier",
      eligibilityTitle: "Vérification d’éligibilité",
      eligibilitySubtitle: "Renseignez vos informations pour vérifier votre éligibilité rapidement.",
      backHome: "Retour",
      fieldNni: "Numéro NNI",
      fieldBirthdate: "Date de naissance",
      fieldWilayaBac: "Wilaya d’obtention du baccalauréat",
      fieldLevel: "Niveau actuel",
      selectPlaceholder: "Sélectionner…",
      checkEligibility: "Vérifier",
      eligibleYes: "Éligible",
      eligibleNo: "Non éligible",
      continueRegister: "Continuer vers l’inscription",
      servicesAccordes: "Services accordés",
      eligibleScholarshipTitle: "Éligible à la bourse",
      serviceAccorde: "Service accordé",
      eligibilityNote:
        "Assurez-vous que les informations saisies correspondent à vos documents officiels.",
      computedAge: "Âge calculé : {{age}} ans",
      eligMsgDateInvalide: "Date de naissance invalide.",
      eligMsgAge: "Vous avez dépassé la limite d’âge de {{years}} ans.",
      eligMsgWilayaManquante: "Veuillez indiquer la wilaya d’obtention du baccalauréat.",
      eligMsgHorsNkc: "Éligible — baccalauréat obtenu hors Nouakchott.",
      eligMsgNkcL3: "Éligible — baccalauréat obtenu à Nouakchott et niveau actuel L3.",
      eligMsgNkcPasL3: "Non éligible — baccalauréat obtenu à Nouakchott : le niveau L3 est requis.",
      registerLead: "Crée ton compte étudiant.",
      registerErrorGeneric: "Inscription impossible. Vérifie les champs ou l’e-mail.",
      fieldMatricule: "Matricule",
      fieldEtablissement: "Établissement",
      fieldFiliere: "Filière",
      selectEtablissementFirstFiliere: "Choisis d’abord ton établissement.",
      registerFiliereHint:
        "Les filières affichées dépendent de l’établissement (liste indicative, à valider avec le CNOU).",
    },
  },
  ar: {
    translation: {
      appName: "سيهيلي",
      tagline: "إدارة المنح الجامعية",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      resetPassword: "نسيت كلمة المرور",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "إرسال",
      cancel: "إلغاء",
      language: "اللغة",
      welcome: "مرحباً",
      homeTitle: "منصة سيهيلي",
      homeLead: "تسجيل، رفع الملف، المتابعة والدفع: تجربة بسيطة وحديثة وشفافة.",
      benefit1: "تقليل التنقلات وزيادة وضوح التقدم",
      benefit2: "إرفاق الوثائق والمتابعة بشكل فوري",
      benefit3: "مسار موجّه من التقديم إلى الدفع",
      ctaCheck: "تحقق من أهليتي",
      ctaLogin: "تسجيل الدخول",
      ctaRegister: "إنشاء حساب",
      badgeEligible: "مؤهل",
      badgeRejected: "مرفوض",
      badgePending: "قيد الانتظار",
      demarchesAlt: "إجراءات تقديم الملف",
      eligibilityTitle: "التحقق من الأهلية",
      eligibilitySubtitle: "أدخل معلوماتك للتحقق من أهليتك بسرعة.",
      backHome: "رجوع",
      fieldNni: "رقم الهوية",
      fieldBirthdate: "تاريخ الازدياد",
      fieldWilayaBac: "ولاية إنجاز البكالوريا",
      fieldLevel: "المستوى الحالي",
      selectPlaceholder: "اختر…",
      checkEligibility: "تحقق",
      eligibleYes: "مؤهل",
      eligibleNo: "غير مؤهل",
      continueRegister: "متابعة نحو إنشاء الحساب",
      servicesAccordes: "الخدمات الممنوحة",
      eligibleScholarshipTitle: "مؤهل للمنحة",
      serviceAccorde: "تم منح الخدمة",
      eligibilityNote: "تأكد من مطابقة المعلومات المدخلة مع وثائقك الرسمية.",
      computedAge: "العمر المحسوب: {{age}} سنة",
      eligMsgDateInvalide: "تاريخ الازدياد غير صالح.",
      eligMsgAge: "لقد تجاوزت حد العمر ({{years}} سنة).",
      eligMsgWilayaManquante: "يرجى اختيار ولاية إنجاز البكالوريا.",
      eligMsgHorsNkc: "مؤهل — بكالوريا خارج نواكشوط.",
      eligMsgNkcL3: "مؤهل — بكالوريا في نواكشوط والمستوى الحالي L3.",
      eligMsgNkcPasL3: "غير مؤهل — بكالوريا في نواكشوط: يلزم المستوى L3.",
      registerLead: "أنشئ حسابك كطالب.",
      registerErrorGeneric: "تعذر التسجيل. تحقق من الحقول أو البريد.",
      fieldMatricule: "الرقم الجامعي (المتريكول)",
      fieldEtablissement: "المؤسّسة",
      fieldFiliere: "الشعبة / التخصص",
      selectEtablissementFirstFiliere: "اختر المؤسّسة أولاً.",
      registerFiliereHint:
        "الشعب المعروضة تتبع المؤسّسة المختارة (قائمة إرشادية يُرجى اعتماد قائمة CNOU النهائية).",
    },
  },
};

const saved = localStorage.getItem("sehily_lang");
const initialLng = saved || "fr";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function setLanguage(lng) {
  localStorage.setItem("sehily_lang", lng);
  i18n.changeLanguage(lng);
  const root = document.documentElement;
  if (lng === "ar") {
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
  } else {
    root.setAttribute("dir", "ltr");
    root.setAttribute("lang", "fr");
  }
}

setLanguage(initialLng);

export default i18n;
