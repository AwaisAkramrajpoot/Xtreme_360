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
  /** Production runs only: the finished catalogue item and what the run cost. */
  item_id?: number | null;
  quantity?: number | string | null;
  total_cost?: number | string | null;
  unit_cost?: number | string | null;
  mfg_date?: string | null;
  already_exists?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProduceManufacturingPayload = {
  /** Same key on a retry → the server returns the first run instead of moving stock again. */
  requestKey: string;
  quantity: number;
  /** Existing product to add stock to; omit to create a new product from the fields below. */
  finishedItemId?: number | null;
  name?: string;
  itemUnit?: string | null;
  itemCategory?: string | null;
  wholesalePrice?: string | number;
  salePrice?: string | number;
  updateItemCost?: boolean;
  description?: string;
  materials: Array<{ itemId: number; quantity: number }>;
};

const optionalNumber = (value?: string | number) =>
  value === undefined || String(value).trim() === "" ? undefined : Number(value);

/** Saves a production run: consumes material stock, adds finished stock, costs it from purchase prices. */
export async function produceManufacturing(payload: ProduceManufacturingPayload) {
  const response = await apiClient.post<ApiEnvelope<ManufacturingRecord>>("/manufacturing/", {
    produce: true,
    request_key: payload.requestKey,
    quantity: payload.quantity,
    finished_item_id: payload.finishedItemId || undefined,
    name: payload.name?.trim() || undefined,
    item_unit: payload.itemUnit || undefined,
    item_category: payload.itemCategory || undefined,
    wholesale_price: optionalNumber(payload.wholesalePrice),
    sale_price: optionalNumber(payload.salePrice),
    update_item_cost: payload.updateItemCost,
    description: payload.description?.trim() ?? "",
    raw_items: payload.materials.map((m) => ({ item_id: m.itemId, quantity: m.quantity })),
  });
  return unwrap(response);
}

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
