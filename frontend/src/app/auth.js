import { authApi, tokenStore } from "../lib/api";
import { clearDemoRole } from "./session";

export async function login(email, password) {
  const r = await authApi.login({ email, password });
  tokenStore.set(r.data);
  // Evite qu'un ancien rôle démo (ex: ETUDIANT) bloque un vrai compte ADMIN.
  clearDemoRole();
  return r.data;
}

export async function fetchMe() {
  const r = await authApi.me();
  return r.data;
}

export function logout() {
  tokenStore.clear();
  clearDemoRole();
}

