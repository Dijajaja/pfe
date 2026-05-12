const LS_COUNT = "sehily_partner_reports_export_count";
const LS_LAST = "sehily_partner_reports_last_export";

/** Dernière génération type maquette (26 avril, année courante). */
function defaultDemoLastIso() {
  const y = new Date().getFullYear();
  return new Date(y, 3, 26, 12, 0, 0, 0).toISOString();
}

export function getPartnerReportsMeta() {
  try {
    const rawC = localStorage.getItem(LS_COUNT);
    const last = localStorage.getItem(LS_LAST);
    /* Aucune persistance encore : KPI alignés maquette (1 relevé, date « Avr 26 »). */
    if (rawC === null && last === null) {
      const lastIso = defaultDemoLastIso();
      setPartnerReportsMeta(1, lastIso);
      return { count: 1, last: lastIso };
    }
    const c = Number.parseInt(rawC || "0", 10);
    return { count: Number.isFinite(c) && c >= 0 ? c : 0, last };
  } catch {
    return { count: 1, last: defaultDemoLastIso() };
  }
}

export function setPartnerReportsMeta(count, lastIso) {
  try {
    localStorage.setItem(LS_COUNT, String(count));
    if (lastIso) localStorage.setItem(LS_LAST, lastIso);
    else localStorage.removeItem(LS_LAST);
  } catch {
    /* ignore */
  }
}
