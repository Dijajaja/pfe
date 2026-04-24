function firstDrfFieldMessage(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length) return String(v[0]);
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export function getApiErrorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  const detail = data?.detail ?? data?.message;
  if (detail != null && String(detail).trim()) return String(detail);
  const fieldMsg = firstDrfFieldMessage(data);
  if (fieldMsg) return fieldMsg;
  if (error?.message) return error.message;
  return fallback;
}

export function shouldUseFallback(error) {
  const status = error?.response?.status;
  return [404, 405, 501, 503].includes(status);
}

