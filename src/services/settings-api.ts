import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";
import type { AppSettingsBundle } from "@/constants/app-settings";

export type SettingsJsonPatch = {
  [K in keyof AppSettingsBundle]?: Partial<AppSettingsBundle[K]>;
};

export type GeneralSettings = {
  enable_tax: boolean;
  enable_discount: boolean;
  settings_json?: Record<string, unknown>;
};

export async function getGeneralSettings() {
  const response = await apiClient.get<ApiEnvelope<GeneralSettings>>("/settings/general");
  return (
    unwrap(response) ?? {
      enable_tax: true,
      enable_discount: true,
      settings_json: {},
    }
  );
}

export async function updateGeneralSettings(payload: {
  enableTax?: boolean;
  enableDiscount?: boolean;
  settingsJson?: SettingsJsonPatch;
}) {
  const body: Record<string, unknown> = {};
  if (payload.enableTax !== undefined) body.enable_tax = payload.enableTax;
  if (payload.enableDiscount !== undefined) body.enable_discount = payload.enableDiscount;
  if (payload.settingsJson !== undefined) body.settings_json = payload.settingsJson;

  const response = await apiClient.patch<ApiEnvelope<GeneralSettings>>("/settings/general", body);
  return unwrap(response);
}
