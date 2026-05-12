const LS_KEY = "sehily_notification_center_reads_v1";

function readMap() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** @param {string} role */
export function getNotificationCenterReadIds(role) {
  const arr = readMap()[role];
  return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
}

/** @param {string} role @param {string} id */
export function appendNotificationCenterReadId(role, id) {
  const map = readMap();
  const prev = new Set(getNotificationCenterReadIds(role));
  prev.add(id);
  map[role] = [...prev];
  writeMap(map);
}

/** @param {string} role @param {string[]} ids */
export function setNotificationCenterReadIds(role, ids) {
  const map = readMap();
  map[role] = [...new Set(ids.filter((x) => typeof x === "string"))];
  writeMap(map);
}
