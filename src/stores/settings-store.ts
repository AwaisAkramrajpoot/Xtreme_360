"use client";

import { create } from "zustand";
import {
  getGeneralSettings,
  updateGeneralSettings,
} from "@/services/settings-api";

type SettingsState = {
  enableTax: boolean;
  enableDiscount: boolean;
  loaded: boolean;
  loading: boolean;
  loadSettings: () => Promise<void>;
  setEnableTax: (value: boolean) => Promise<void>;
  setEnableDiscount: (value: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  enableTax: true,
  enableDiscount: true,
  loaded: false,
  loading: false,

  loadSettings: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await getGeneralSettings();
      set({
        enableTax: data.enable_tax !== false,
        enableDiscount: data.enable_discount !== false,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setEnableTax: async (value) => {
    const prev = get().enableTax;
    set({ enableTax: value });
    try {
      const data = await updateGeneralSettings({ enableTax: value });
      set({
        enableTax: data?.enable_tax !== false,
        enableDiscount: data?.enable_discount !== false,
        loaded: true,
      });
    } catch {
      set({ enableTax: prev });
      throw new Error("Failed to update tax setting");
    }
  },

  setEnableDiscount: async (value) => {
    const prev = get().enableDiscount;
    set({ enableDiscount: value });
    try {
      const data = await updateGeneralSettings({ enableDiscount: value });
      set({
        enableTax: data?.enable_tax !== false,
        enableDiscount: data?.enable_discount !== false,
        loaded: true,
      });
    } catch {
      set({ enableDiscount: prev });
      throw new Error("Failed to update discount setting");
    }
  },
}));
