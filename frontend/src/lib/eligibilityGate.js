const STORAGE_KEY = "sehily_eligibility_ref";

export function saveEligibilityRef(payload) {
  if (!payload) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadEligibilityRef() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearEligibilityRef() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function canRegisterFromEligibility() {
  const ref = loadEligibilityRef();
  return Boolean(ref?.eligible && ref?.etudiant);
}
