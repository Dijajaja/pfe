import axios from "axios";

export const api = axios.create({
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

    const tokens = getTokens();
    if (!tokens?.refresh) {
      clearTokens();
      throw error;
    }

    original.__isRetryRequest = true;

    if (!refreshPromise) {
      refreshPromise = api
        .post("/api/v1/auth/token/refresh/", { refresh: tokens.refresh })
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

    const nextTokens = await refreshPromise;
    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${nextTokens.access}`;
    return api.request(original);
  }
);

export const authApi = {
  register: (payload) => api.post("/api/v1/auth/inscription/", payload),
  login: (payload) => api.post("/api/v1/auth/token/", payload),
  me: () => api.get("/api/v1/auth/moi/"),
};

export const tokenStore = {
  get: getTokens,
  set: setTokens,
  clear: clearTokens,
};

