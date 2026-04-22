const NOUAKCHOTT = "nouakchott";

function normalizeWilaya(wilaya) {
  return String(wilaya || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function calcAgeYears(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const md = now.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

/**
 * Règles côté client (MVP) — alignement avec le cahier (à remplacer par l'API quand dispo)
 * Les textes affichés sont i18n (clé `i18nKey` + params éventuels).
 */
export function evaluerEligibilite({ dateNaissance, wilayaBac, niveau }) {
  const age = calcAgeYears(dateNaissance);
  if (age === null) {
    return { ok: false, code: "DATE_INVALIDE", i18nKey: "eligMsgDateInvalide" };
  }
  if (age >= 24) {
    return { ok: false, code: "AGE", i18nKey: "eligMsgAge", i18nParams: { years: 24 } };
  }

  const w = normalizeWilaya(wilayaBac);
  if (!w) {
    return { ok: false, code: "WILAYA_MANQUANTE", i18nKey: "eligMsgWilayaManquante" };
  }

  const niveauKey = String(niveau || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (w !== NOUAKCHOTT) {
    return { ok: true, code: "HORS_NOUAKCHOTT", i18nKey: "eligMsgHorsNkc" };
  }

  // Nouakchott
  if (niveauKey === "L3") {
    return { ok: true, code: "NOUAKCHOTT_L3", i18nKey: "eligMsgNkcL3" };
  }
  return {
    ok: false,
    code: "NOUAKCHOTT_PAS_L3",
    i18nKey: "eligMsgNkcPasL3",
  };
}
