/** Heuristic: standard UUID string (liste bénéficiaires, etc.) */
export function looksLikeUuid(value) {
  const s = value == null ? "" : String(value).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * @returns {{ short: string, full: string }} short for UI, full for title/tooltip
 */
export function formatShortListeReference(ref) {
  const full = ref == null ? "" : String(ref).trim();
  if (!full) return { short: "—", full: "" };
  if (looksLikeUuid(full)) return { short: `Liste ${full.slice(0, 8)}…`, full };
  if (full.length > 18) return { short: `${full.slice(0, 16)}…`, full };
  return { short: full, full };
}
