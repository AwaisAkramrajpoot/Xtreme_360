import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  isInitialized: boolean;
  language: string;
  setToken: (token: string | null) => void;
  setInitialized: (value: boolean) => void;
  setLanguage: (lang: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isInitialized: false,
      language: "ur",
      setToken: (token) => set({ token }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setLanguage: (language) => set({ language }),
      logout: () => set({ token: null }),
    }),
    { name: "xtreme-auth" }
  )
);
