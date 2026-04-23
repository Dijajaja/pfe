import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 20000,
});
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 20000,
});

function getTokens() {
  const raw = localStorage.getItem("sehily_tokens");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setTokens(tokens) {
  localStorage.setItem("sehily_tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("sehily_tokens");
}

let refreshPromise = null;

function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenExpired(token, skewSeconds = 20) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

export async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh || isTokenExpired(tokens.refresh, 0)) {
    clearTokens();
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/api/auth/refresh/", { refresh: tokens.refresh })
      .then((r) => {
        const next = { ...tokens, access: r.data.access };
        setTokens(next);
        return next;
      })
      .catch((e) => {
        clearTokens();
        throw e;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function ensureValidAccessToken() {
  const tokens = getTokens();
  if (!tokens?.access && !tokens?.refresh) {
    throw new Error("Aucun token de session.");
  }
  if (tokens?.access && !isTokenExpired(tokens.access)) {
    return tokens.access;
  }
  const next = await refreshAccessToken();
  return next.access;
}

api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    if (status !== 401 || !original || original.__isRetryRequest) {
      throw error;
    }

    original.__isRetryRequest = true;
    const nextTokens = await refreshAccessToken();
    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${nextTokens.access}`;
    return api.request(original);
  }
);

export const authApi = {
  register: (payload) => api.post("/api/auth/register/", payload),
  login: (payload) => api.post("/api/auth/login/", payload),
  me: () => api.get("/api/auth/me/"),
};

export const tokenStore = {
  get: getTokens,
  set: setTokens,
  clear: clearTokens,
  isAccessExpired: (token) => isTokenExpired(token),
};

