import { useQuery } from "@tanstack/react-query";

import { authApi, tokenStore } from "../lib/api";

const DEMO_ROLE_KEY = "sehily_demo_role";

export function normalizeRole(role) {
  if (!role) return null;
  if (role === "ADMIN_CNOU") return "ADMIN";
  return role;
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

