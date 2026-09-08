import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type ManufacturingRawItem = {
  id?: number;
  manufacturing_id?: number;
  item_name: string;
  item_type?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  discount?: number;
  amount?: number;
};

export type ManufacturingRecord = {
  id: number;
  user_id?: string;
  name: string;
  wholesale_price?: number | string | null;
  sale_price?: number | string | null;
  description?: string | null;
  raw_items?: ManufacturingRawItem[];
  created_at?: string;
  updated_at?: string;
};

export type CreateManufacturingPayload = {
  name: string;
  wholesalePrice?: string | number;
  salePrice?: string | number;
  description?: string;
  rawItems?: Array<{
    itemName: string;
    itemType?: string;
    quantity?: number;
    unit?: string;
    rate?: number;
    discount?: number;
    amount?: number;
  }>;
};

export async function getManufacturing() {
  const response = await apiClient.get<ApiEnvelope<ManufacturingRecord[]>>("/manufacturing/");
  return unwrap(response) ?? [];
}

export async function createManufacturing(payload: CreateManufacturingPayload) {
  const rawItems = (payload.rawItems ?? [])
    .filter((item) => item.itemName.trim())
    .map((item) => ({
      item_name: item.itemName.trim(),
      item_type: item.itemType ?? "item",
      quantity: item.quantity ?? 1,
      unit: item.unit ?? "",
      rate: item.rate ?? 0,
      discount: item.discount ?? 0,
      amount: item.amount ?? 0,
    }));

  const response = await apiClient.post<ApiEnvelope<ManufacturingRecord>>("/manufacturing/", {
    name: payload.name.trim(),
    wholesale_price: Number(payload.wholesalePrice) || 0,
    sale_price: Number(payload.salePrice) || 0,
    description: payload.description?.trim() ?? "",
    // Backend only parses raw_items when sent as a JSON string
    raw_items: JSON.stringify(rawItems),
  });
  return unwrap(response);
}
