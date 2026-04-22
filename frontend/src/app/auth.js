import { authApi, tokenStore } from "../lib/api";

export async function login(email, password) {
  const r = await authApi.login({ email, password });
  tokenStore.set(r.data);
  return r.data;
}

export async function fetchMe() {
  const r = await authApi.me();
  return r.data;
}

export function logout() {
  tokenStore.clear();
}

