"use client";

import { create } from "zustand";
import {
  getGeneralSettings,
  updateGeneralSettings,
  type GeneralSettings,
} from "@/services/settings-api";
import { type ItemSettings } from "@/constants/item-settings";
import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  type AppSettingsBundle,
  type SettingsSectionKey,
} from "@/constants/app-settings";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorMessage } from "@/utils/api-error";

type SettingsState = {
  enableTax: boolean;
  enableDiscount: boolean;
  /** All settings_json sections, merged with defaults. */
  app: AppSettingsBundle;
  /** Alias of `app.item`, kept for existing consumers. */
  itemSettings: ItemSettings;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  loadSettings: (options?: { force?: boolean }) => Promise<void>;
  setEnableTax: (value: boolean) => Promise<void>;
  setEnableDiscount: (value: boolean) => Promise<void>;
  patchSection: <S extends SettingsSectionKey>(
    section: S,
    patch: Partial<AppSettingsBundle[S]>
  ) => Promise<void>;
  patchItemSettings: (patch: Partial<ItemSettings>) => Promise<void>;
  setItemSetting: <K extends keyof ItemSettings>(key: K, value: ItemSettings[K]) => Promise<void>;
  reset: () => void;
};

// Bumped on reset so responses for a previous session are ignored.
let generation = 0;
// Saves in flight; server snapshots are only applied once all have settled,
// otherwise an older response could briefly revert a newer optimistic toggle.
let pendingSaves = 0;

function fromApi(data: GeneralSettings) {
  const app = mergeAppSettings(data.settings_json);
  return {
    enableTax: data.enable_tax !== false,
    enableDiscount: data.enable_discount !== false,
    app,
    itemSettings: app.item,
  };
}

const initialState = {
  enableTax: true,
  enableDiscount: true,
  app: DEFAULT_APP_SETTINGS,
  itemSettings: DEFAULT_APP_SETTINGS.item,
  loaded: false,
  loading: false,
  error: null as string | null,
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  /** Optimistically applies `apply`, saves via `save`, and rolls back with `revert` on failure. */
  async function optimisticSave(
    apply: () => void,
    revert: () => void,
    save: () => Promise<GeneralSettings | undefined>
  ) {
    const gen = generation;
    apply();
    pendingSaves += 1;
    try {
      const data = await save();
      if (gen !== generation) return;
      pendingSaves -= 1;
      if (data && pendingSaves === 0) set(fromApi(data));
    } catch (error) {
      if (gen === generation) {
        pendingSaves -= 1;
        revert();
      }
      throw error;
    }
  }

  return {
    ...initialState,

    loadSettings: async ({ force = false } = {}) => {
      if (get().loading || (get().loaded && !force)) return;
      const gen = generation;
      set({ loading: true, error: null });
      try {
        const data = await getGeneralSettings();
        if (gen !== generation) return;
        set({ ...fromApi(data), loaded: true, error: null });
      } catch (error) {
        if (gen !== generation) return;
        // Defaults stay in place so the app keeps working; screens can offer a retry.
        set({ loaded: true, error: getApiErrorMessage(error, "Failed to load settings") });
      } finally {
        if (gen === generation) set({ loading: false });
      }
    },

    setEnableTax: async (value) => {
      const prev = get().enableTax;
      await optimisticSave(
        () => set({ enableTax: value }),
        () => set({ enableTax: prev }),
        () => updateGeneralSettings({ enableTax: value })
      );
    },

    setEnableDiscount: async (value) => {
      const prev = get().enableDiscount;
      await optimisticSave(
        () => set({ enableDiscount: value }),
        () => set({ enableDiscount: prev }),
        () => updateGeneralSettings({ enableDiscount: value })
      );
    },

    patchSection: async (section, patch) => {
      const previous = get().app[section];
      // Only the patched keys are rolled back, so concurrent edits to other keys survive.
      const rollback = Object.fromEntries(
        Object.keys(patch).map((key) => [key, previous[key as keyof typeof previous]])
      ) as Partial<AppSettingsBundle[typeof section]>;

      const merge = (values: Partial<AppSettingsBundle[typeof section]>) => {
        const app = { ...get().app, [section]: { ...get().app[section], ...values } };
        set({ app, itemSettings: app.item });
      };

      await optimisticSave(
        () => merge(patch),
        () => merge(rollback),
        () => updateGeneralSettings({ settingsJson: { [section]: patch } })
      );
    },

    patchItemSettings: async (patch) => {
      await get().patchSection("item", patch);
    },

    setItemSetting: async (key, value) => {
      await get().patchSection("item", { [key]: value } as Partial<ItemSettings>);
    },

    reset: () => {
      generation += 1;
      pendingSaves = 0;
      set({ ...initialState });
    },
  };
});

// Settings belong to the signed-in user: drop them whenever the session changes so the
// next user (or the same user after logging back in) always gets a fresh copy from the API.
useAuthStore.subscribe((state, prev) => {
  if (state.token !== prev.token) {
    useSettingsStore.getState().reset();
  }
});
