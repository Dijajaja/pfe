const KEY = "sehily_partner_settings_v1";

const DEFAULTS = {
  paymentNotif: true,
  emailNotif: true,
  defaultLang: "fr",
  apiKeyDisplay: "mp_sk_live_••••••••••••",
  /** ISO — présent après au moins une sauvegarde réussie. */
  updatedAt: null,
};

export function loadPartnerSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Fusionne avec les valeurs déjà stockées et enregistre dans `localStorage`.
 * @param {Record<string, unknown>} partial
 * @returns {Record<string, unknown>}
 */
export function savePartnerSettings(partial) {
  const next = {
    ...loadPartnerSettings(),
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("sehily-partner-settings-saved", { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}
