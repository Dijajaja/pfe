const LS_KEY = "sehily_partner_notif_read";

/** Ancienne liste fixe → IDs du fil construit depuis les paiements. */
const LEGACY_READ_MAP = {
  pending: "partner-notif-backlog",
  update: "partner-notif-sync",
  "last-confirmed": "partner-notif-summary",
};

function migrateIds(ids) {
  const raw = Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  return [...new Set(raw.map((id) => LEGACY_READ_MAP[id] || id))];
}

export function getReadPartnerNotificationIds() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const arr = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    return migrateIds(arr);
  } catch {
    return [];
  }
}

export function setReadPartnerNotificationIds(ids) {
  const normalized = migrateIds(Array.isArray(ids) ? ids : []);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("sehily-partner-notif-read"));
  } catch {
    /* ignore */
  }
}

export function appendReadPartnerNotificationId(id) {
  if (typeof id !== "string" || !id) return;
  const prev = getReadPartnerNotificationIds();
  if (prev.includes(id)) return;
  setReadPartnerNotificationIds([...prev, id]);
}

/** Marque comme lues toutes les notifications dont les IDs sont fournis (fil courant). */
export function markAllPartnerNotificationsRead(notificationIds) {
  const extra = Array.isArray(notificationIds) ? notificationIds.filter((x) => typeof x === "string") : [];
  const prev = getReadPartnerNotificationIds();
  setReadPartnerNotificationIds([...new Set([...prev, ...extra])]);
}
