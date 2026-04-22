const FALLBACK_KEY = "sehily_fallback_endpoints";
const EVENT_NAME = "sehily:fallback-updated";

function readSet() {
  try {
    const raw = sessionStorage.getItem(FALLBACK_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  sessionStorage.setItem(FALLBACK_KEY, JSON.stringify(Array.from(set)));
}

function emit() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function markFallbackEndpoint(endpointTag) {
  if (!endpointTag) return;
  const set = readSet();
  set.add(endpointTag);
  writeSet(set);
  emit();
}

export function getFallbackEndpoints() {
  return Array.from(readSet());
}

export function clearFallbackEndpoints() {
  sessionStorage.removeItem(FALLBACK_KEY);
  emit();
}

export function subscribeFallback(listener) {
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

