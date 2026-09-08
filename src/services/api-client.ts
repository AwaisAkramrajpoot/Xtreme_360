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
