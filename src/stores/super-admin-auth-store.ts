"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SuperAdminProfile = { id: number; email: string; name: string };

/**
 * Super Admin session, kept apart from the normal `xtreme-auth` session so the two never mix.
 * Holds only the access token and public profile — never the password. The server is the
 * authority: every request is re-validated there, this store just remembers the token.
 */
type SuperAdminAuthState = {
  token: string | null;
  admin: SuperAdminProfile | null;
  /** ms since epoch; the token is treated as gone after this. */
  expiresAt: number | null;
  /** Shown once on the login page, e.g. after an expired session. */
  notice: string | null;
  hasHydrated: boolean;
  setSession: (token: string, admin: SuperAdminProfile, expiresInSeconds: number) => void;
  setAdmin: (admin: SuperAdminProfile) => void;
  clear: (notice?: string | null) => void;
  setHasHydrated: (value: boolean) => void;
};

export const SUPER_ADMIN_STORAGE_KEY = "xtreme-super-admin";

export const useSuperAdminAuthStore = create<SuperAdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      expiresAt: null,
      notice: null,
      hasHydrated: false,
      setSession: (token, admin, expiresInSeconds) =>
        set({ token, admin, expiresAt: Date.now() + expiresInSeconds * 1000, notice: null }),
      setAdmin: (admin) => set({ admin }),
      clear: (notice = null) => set({ token: null, admin: null, expiresAt: null, notice }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: SUPER_ADMIN_STORAGE_KEY,
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        expiresAt: state.expiresAt,
        notice: state.notice,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

/** Token that is present and not past its expiry. */
export const hasLiveSuperAdminSession = (state: Pick<SuperAdminAuthState, "token" | "expiresAt">) =>
  Boolean(state.token) && (!state.expiresAt || state.expiresAt > Date.now());
