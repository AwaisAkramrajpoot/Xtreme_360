"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionProfileStore } from "@/stores/session-profile-store";

export function useSessionProfile() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const logout = useAuthStore((s) => s.logout);
  const loadSessionProfile = useSessionProfileStore((s) => s.loadSessionProfile);
  const clearSessionProfile = useSessionProfileStore((s) => s.clearSessionProfile);
  const loading = useSessionProfileStore((s) => s.loading);
  const error = useSessionProfileStore((s) => s.error);
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);

  useEffect(() => {
    if (!hasHydrated) return;

    let active = true;

    const run = async () => {
      if (!token) {
        clearSessionProfile();
        router.replace(RouteName.welcome);
        return;
      }

      const result = await loadSessionProfile();
      if (!active) return;

      if (result === "unauthorized") {
        logout();
        clearSessionProfile();
        router.replace(RouteName.welcome);
        return;
      }

      // Signed in but onboarding was never finished: register the business first.
      if (useSessionProfileStore.getState().needsBusiness) {
        router.replace(RouteName.businessRegisteration);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [clearSessionProfile, hasHydrated, loadSessionProfile, logout, router, token]);

  return { user, business, loading, error, hasHydrated };
}
