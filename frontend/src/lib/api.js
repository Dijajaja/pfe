/**
 * Client Axios unique pour Django REST (JWT + routes métier).
 * Base URL : `VITE_API_BASE_URL` (sans slash final). Chemins : `endpoints.js`
 * et `backend/config/api_alias_urls.py`.
 */
import axios from "axios";

import { endpoints } from "./endpoints";

function normalizeBaseUrl(url) {
  const raw = url || "http://127.0.0.1:8000";
  return String(raw).replace(/\/+$/, "");
}

const baseURL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL,
  timeout: 20000,
});
const refreshClient = axios.create({
  baseURL,
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
      .post(endpoints.auth.refresh, { refresh: tokens.refresh })
      .then((r) => {
        const next = {
          access: r.data.access,
          refresh: r.data.refresh ?? tokens.refresh,
        };
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
  register: (payload) => api.post(endpoints.auth.register, payload),
  login: (payload) => api.post(endpoints.auth.login, payload),
  me: () => api.get(endpoints.auth.me),
};

export const tokenStore = {
  get: getTokens,
  set: setTokens,
  clear: clearTokens,
  isAccessExpired: (token) => isTokenExpired(token),
};

