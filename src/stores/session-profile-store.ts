"use client";

import { create } from "zustand";
import { useAuthStore } from "@/stores/auth-store";
import {
  getCurrentBusiness,
  getCurrentUser,
  updateUserProfile,
  type BusinessRecord,
  type UserProfile,
} from "@/services/session-api";

type SessionLoadResult = "ready" | "missing-token" | "unauthorized" | "error";

interface SessionProfileState {
  user: UserProfile | null;
  business: BusinessRecord | null;
  loading: boolean;
  error: string | null;
  loadedToken: string | null;
  loadSessionProfile: (force?: boolean) => Promise<SessionLoadResult>;
  updateProfileImage: (file: File) => Promise<UserProfile>;
  clearSessionProfile: () => void;
}

function getStatusCode(error: unknown) {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}

export const useSessionProfileStore = create<SessionProfileState>((set, get) => ({
  user: null,
  business: null,
  loading: false,
  error: null,
  loadedToken: null,
  loadSessionProfile: async (force = false) => {
    const token = useAuthStore.getState().token;

    if (!token) {
      set({
        user: null,
        business: null,
        loading: false,
        error: null,
        loadedToken: null,
      });
      return "missing-token";
    }

    if (!force && get().loadedToken === token && (get().user || get().business)) {
      return "ready";
    }

    set({ loading: true, error: null });

    try {
      const [userResult, businessResult] = await Promise.allSettled([
        getCurrentUser(),
        getCurrentBusiness(),
      ]);

      if (userResult.status === "rejected") {
        if (getStatusCode(userResult.reason) === 401) {
          set({
            user: null,
            business: null,
            loading: false,
            error: "Session expired",
            loadedToken: null,
          });
          return "unauthorized";
        }
        throw userResult.reason;
      }

      const user = userResult.value;
      let business: BusinessRecord | null = null;

      if (businessResult.status === "fulfilled") {
        business = businessResult.value;
      } else if (getStatusCode(businessResult.reason) === 401) {
        set({
          user: null,
          business: null,
          loading: false,
          error: "Session expired",
          loadedToken: null,
        });
        return "unauthorized";
      }

      if (!business && user.businesses?.length) {
        business = user.businesses[0];
      }

      set({
        user,
        business,
        loading: false,
        error: null,
        loadedToken: token,
      });
      return "ready";
    } catch {
      set({
        user: null,
        business: null,
        loading: false,
        error: "Unable to load session details",
        loadedToken: null,
      });
      return "error";
    }
  },
  updateProfileImage: async (file) => {
    const updatedUser = await updateUserProfile({ profileImage: file });
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
      error: null,
    }));
    return updatedUser;
  },
  clearSessionProfile: () =>
    set({
      user: null,
      business: null,
      loading: false,
      error: null,
      loadedToken: null,
    }),
}));
