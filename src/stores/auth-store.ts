import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isInitialized: boolean;
  language: string;
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setSessionFromToken: (token: string | null) => void;
  setInitialized: (value: boolean) => void;
  setLanguage: (lang: string) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as { id?: string; email?: string; name?: string };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      userEmail: null,
      userName: null,
      isInitialized: false,
      language: "ur",
      hasHydrated: false,
      setToken: (token) =>
        set((state) => {
          if (!token) {
            return {
              ...state,
              token: null,
              userId: null,
              userEmail: null,
              userName: null,
            };
          }

          const payload = decodeJwtPayload(token);
          return {
            ...state,
            token,
            userId: payload?.id ?? null,
            userEmail: payload?.email ?? null,
            userName: payload?.name ?? null,
          };
        }),
      setSessionFromToken: (token) =>
        set((state) => {
          if (!token) {
            return {
              ...state,
              token: null,
              userId: null,
              userEmail: null,
              userName: null,
            };
          }

          const payload = decodeJwtPayload(token);
          return {
            ...state,
            token,
            userId: payload?.id ?? null,
            userEmail: payload?.email ?? null,
            userName: payload?.name ?? null,
          };
        }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setLanguage: (language) => set({ language }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () =>
        set({
          token: null,
          userId: null,
          userEmail: null,
          userName: null,
        }),
    }),
    {
      name: "xtreme-auth",
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        userEmail: state.userEmail,
        userName: state.userName,
        isInitialized: state.isInitialized,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
