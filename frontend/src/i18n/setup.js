import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      appName: "SEHILY",
      tagline: "Dépôt de bourses simplifié",
      login: "Connexion",
      register: "Inscription",
      resetPassword: "Mot de passe oublié",
      email: "E-mail",
      password: "Mot de passe",
      submit: "Soumettre",
      cancel: "Annuler",
      language: "Langue",
      welcome: "Bienvenue",
    },
  },
  ar: {
    translation: {
      appName: "سيهيلي",
      tagline: "إيداع المنح مبسّط",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      resetPassword: "نسيت كلمة المرور",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      submit: "إرسال",
      cancel: "إلغاء",
      language: "اللغة",
      welcome: "مرحباً",
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
