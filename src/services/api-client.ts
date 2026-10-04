import axios from "axios";
import { AppConfig } from "@/constants/config";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: AppConfig.apiUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) {
    config.headers.Authorization = `Bearer ${storeToken}`;
    return config;
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("xtreme-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers) {
          delete config.headers.Authorization;
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return config;
});

// An expired or revoked token on any authenticated call ends the session. Clearing the token
// makes DashboardShell (useSessionProfile) redirect to Welcome, so screens never sit on a
// stream of "Unauthorized" errors. Auth endpoints report 401 as a normal form error instead.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || "");
    if (status === 401 && !url.includes("/auth/") && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
