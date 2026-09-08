import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type UnitRecord = {
  id: number;
  user_id?: string;
  name: string;
  abbreviation: string;
  created_at?: string;
  updated_at?: string;
};

export type UnitConversionRecord = {
  id: number;
  user_id?: string;
  base_unit: string;
  secondary_unit: string;
  base_unit_qty: number;
  secondary_unit_qty: number;
};

export type UnitOverviewRecord = UnitRecord & {
  has_conversion?: boolean;
  conversions_count?: number;
  conversions?: UnitConversionRecord[];
};

export async function getUnits() {
  const response = await apiClient.get<ApiEnvelope<UnitRecord[]>>("/units/");
  return unwrap(response) ?? [];
}

export async function getUnitsOverview(search = "") {
  const response = await apiClient.get<ApiEnvelope<UnitOverviewRecord[]>>("/units/overview", {
    params: search ? { search } : undefined,
  });
  return unwrap(response) ?? [];
}

export async function createUnit(payload: { name: string; abbreviation: string }) {
  const response = await apiClient.post<ApiEnvelope<UnitRecord>>("/units/", {
    name: payload.name.trim(),
    abbreviation: payload.abbreviation.trim(),
  });
  return unwrap(response);
}

export async function createUnitConversion(payload: {
  baseUnit: string;
  secondaryUnit: string;
  baseUnitQty: number;
  secondaryUnitQty: number;
}) {
  const response = await apiClient.post<ApiEnvelope<UnitConversionRecord>>("/units/conversions", {
    base_unit: payload.baseUnit.trim(),
    secondary_unit: payload.secondaryUnit.trim(),
    base_unit_qty: payload.baseUnitQty,
    secondary_unit_qty: payload.secondaryUnitQty,
  });
  return unwrap(response);
}

export async function getUnitConversions() {
  const response = await apiClient.get<ApiEnvelope<UnitConversionRecord[]>>("/units/conversions");
  return unwrap(response) ?? [];
}
