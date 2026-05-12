/**
 * Notifications partenaire dérivées des paiements opérationnels (API / fallback)
 * et de l’historique local de confirmation — pas d’endpoint dédié côté serveur.
 */

const MS_DAY = 86400000;

/** Aligné sur PartnerBatchesPage.enrichPayments (réf. / dates pour filtres & notifs). */
export function enrichPartnerPaymentRows(rows = []) {
  return rows.map((item, index) => {
    const emission = item.date_emission || item.date_operation || new Date(Date.now() - index * 86400000).toISOString();
    const echeance = new Date(new Date(emission).getTime() + 4 * MS_DAY).toISOString();
    return {
      ...item,
      emission,
      echeance,
      etudiantLabel: item.etudiant_email || `Étudiant #${item.dossier_id}`,
      referenceLabel: item.reference_externe || `P${String(item.id).padStart(6, "0")}`,
    };
  });
}

function localeFrom(lang) {
  return String(lang || "").startsWith("ar") ? "ar" : "fr-FR";
}

function formatShort(isoLike, lang) {
  if (!isoLike) return "—";
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(localeFrom(lang), { dateStyle: "short", timeStyle: "short" });
}

function formatDay(isoLike, lang) {
  if (!isoLike) return "—";
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(localeFrom(lang), { day: "2-digit", month: "2-digit" });
}

/**
 * @param {Array<object>} payments — lignes enrichies (referenceLabel, etudiantLabel, emission, echeance, statut, id, montant)
 * @param {Array<{ id: number, date: string, reference: string, detail: string }>} confirmHistory
 * @param {{ dataUpdatedAt?: number; locale?: string }} [opts]
 */
export function buildPartnerNotificationsFeed(payments, confirmHistory, opts = {}) {
  const rows = enrichPartnerPaymentRows(Array.isArray(payments) ? payments : []);
  const hist = Array.isArray(confirmHistory) ? confirmHistory : [];
  const lang = opts.locale || "fr";
  const now = Date.now();
  const items = [];

  const waiting = rows.filter((p) => p.statut === "ENVOYE");
  const completed = rows.filter((p) => p.statut === "EFFECTUE");
  const waitingCount = waiting.length;

  items.push({
    id: "partner-notif-backlog",
    title: `${waitingCount} paiement${waitingCount > 1 ? "s" : ""} à traiter`,
    message:
      waitingCount > 0
        ? `Références : ${waiting
            .slice(0, 4)
            .map((p) => p.referenceLabel)
            .join(", ")}${waiting.length > 4 ? "…" : ""}.`
        : "Aucun paiement en attente de confirmation Mauripost.",
    type: waitingCount > 0 ? "warning" : "success",
    timeLabel: formatDay(new Date().toISOString(), lang),
  });

  const dueSoon = waiting.filter((p) => {
    const ref = p.echeance || p.emission;
    const d = new Date(ref);
    if (Number.isNaN(d.getTime())) return false;
    const t = d.getTime();
    return t >= now - MS_DAY && t <= now + 3 * MS_DAY;
  });
  for (const p of dueSoon.slice(0, 6)) {
    items.push({
      id: `partner-notif-due-${p.id}`,
      title: `Échéance proche — ${p.referenceLabel}`,
      message: `${Number(p.montant || 0).toLocaleString()} MRU — ${p.etudiantLabel}`,
      type: "warning",
      timeLabel: formatShort(p.echeance || p.emission, lang),
    });
  }

  if (typeof opts.dataUpdatedAt === "number" && !Number.isNaN(opts.dataUpdatedAt)) {
    items.push({
      id: "partner-notif-sync",
      title: "Synchronisation des paiements",
      message: "Les montants ci-dessous proviennent de la dernière requête vers le serveur CNOU / Mauripost.",
      type: "info",
      timeLabel: formatShort(new Date(opts.dataUpdatedAt).toISOString(), lang),
    });
  }

  const recentDone = [...completed]
    .sort((a, b) => new Date(b.emission || 0) - new Date(a.emission || 0))
    .slice(0, 6);
  for (const p of recentDone) {
    items.push({
      id: `partner-notif-paid-${p.id}`,
      title: "Paiement effectué",
      message: `${p.referenceLabel} — ${p.etudiantLabel} — ${Number(p.montant || 0).toLocaleString()} MRU`,
      type: "success",
      timeLabel: formatShort(p.emission, lang),
    });
  }

  for (const h of hist.slice(0, 8)) {
    items.push({
      id: `partner-notif-history-${h.id}`,
      title: "Confirmation enregistrée",
      message: `${h.reference} — ${h.detail}`,
      type: "info",
      timeLabel: formatShort(h.date, lang),
    });
  }

  if (rows.length > 0) {
    items.push({
      id: "partner-notif-summary",
      title: "Synthèse file partenaire",
      message: `${rows.length} ligne(s) — ${completed.length} effectuée(s), ${waitingCount} à traiter.`,
      type: "info",
      timeLabel: "—",
    });
  }

  return items;
}

export function countUnreadPartnerNotifications(readIds, notifications) {
  const set = new Set(readIds);
  return notifications.filter((n) => !set.has(n.id)).length;
}
