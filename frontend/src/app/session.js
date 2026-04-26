import { useQuery } from "@tanstack/react-query";

import { authApi, tokenStore } from "../lib/api";

const DEMO_ROLE_KEY = "sehily_demo_role";

export function normalizeRole(role) {
  if (role == null || role === "") return null;
  const s = String(role).trim();
  if (!s) return null;
  if (s === "ADMIN_CNOU" || s.toUpperCase() === "ADMIN_CNOU") return "ADMIN";
  return s.toUpperCase();
}

/** Espace d’accueil après login (évite d’afficher /403 en boucle). */
export function getHomePathForRole(role) {
  const r = normalizeRole(role);
  if (r === "ADMIN") return "/app/admin/dashboard";
  if (r === "PARTENAIRE") return "/app/partner/dashboard";
  if (r === "ETUDIANT") return "/app/student/dashboard";
  return "/app";
}

export function getDemoRole() {
  const role = localStorage.getItem(DEMO_ROLE_KEY);
  return role ? normalizeRole(role) : null;
}

export function setDemoRole(role) {
  if (!role) {
    localStorage.removeItem(DEMO_ROLE_KEY);
    return;
  }
  localStorage.setItem(DEMO_ROLE_KEY, normalizeRole(role));
}

export function clearDemoRole() {
  localStorage.removeItem(DEMO_ROLE_KEY);
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    enabled: !!tokenStore.get()?.access,
    queryFn: async () => {
      const r = await authApi.me();
      return r.data;
    },
    retry: false,
  });
}

export function useEffectiveRole() {
  const demoRole = getDemoRole();
  const me = useCurrentUser();
  const apiRole = normalizeRole(me.data?.role);
  const hasSession = !!tokenStore.get()?.access || !!tokenStore.get()?.refresh;
  return {
    // En session authentifiée, le rôle doit toujours venir du backend.
    role: apiRole || (hasSession ? null : demoRole || "ETUDIANT"),
    user: me.data || null,
    isLoading: me.isLoading,
  };
}

