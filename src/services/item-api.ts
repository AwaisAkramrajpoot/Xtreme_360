import { apiClient } from "@/services/api-client";
import { appendIfPresent, unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type ItemRecord = {
  id: number;
  user_id?: string;
  item_type?: string | null;
  item_name: string;
  item_code?: string | null;
  item_unit?: string | null;
  item_category?: string | null;
  description?: string | null;
  item_image?: string | null;
  sale_price?: number | string | null;
  purchase_price?: number | string | null;
  wholesale_price?: number | string | null;
  opening_stock?: number | string | null;
  as_of_date?: string | null;
  at_price?: number | string | null;
  min_stock_qty?: number | string | null;
  item_location?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ItemCategoryRecord = {
  id: number;
  user_id?: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateItemPayload = {
  itemName: string;
  itemType?: string;
  itemCode?: string;
  itemUnit?: string | null;
  itemCategory?: string | null;
  description?: string;
  salePrice?: string | number;
  purchasePrice?: string | number;
  wholesalePrice?: string | number;
  openingStock?: string | number;
  asOfDate?: string;
  atPrice?: string | number;
  minStockQty?: string | number;
  itemLocation?: string;
  itemImage?: File | null;
};

export async function getItems(type?: string) {
  const response = await apiClient.get<ApiEnvelope<ItemRecord[]>>("/items/", {
    params: type ? { type } : undefined,
  });
  return unwrap(response) ?? [];
}

export async function createItem(payload: CreateItemPayload) {
  const formData = new FormData();
  formData.append("item_name", payload.itemName.trim());
  appendIfPresent(formData, "item_type", payload.itemType ?? "product");
  appendIfPresent(formData, "item_code", payload.itemCode);
  appendIfPresent(formData, "item_unit", payload.itemUnit);
  appendIfPresent(formData, "item_category", payload.itemCategory);
  appendIfPresent(formData, "description", payload.description);
  appendIfPresent(formData, "sale_price", payload.salePrice);
  appendIfPresent(formData, "purchase_price", payload.purchasePrice);
  appendIfPresent(formData, "wholesale_price", payload.wholesalePrice);
  appendIfPresent(formData, "opening_stock", payload.openingStock);
  appendIfPresent(formData, "as_of_date", payload.asOfDate);
  appendIfPresent(formData, "at_price", payload.atPrice);
  appendIfPresent(formData, "min_stock_qty", payload.minStockQty);
  appendIfPresent(formData, "item_location", payload.itemLocation);
  if (payload.itemImage) {
    formData.append("item_image", payload.itemImage);
  }

  const response = await apiClient.post<ApiEnvelope<ItemRecord>>("/items/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
}

export async function getItemCategories() {
  const response = await apiClient.get<ApiEnvelope<ItemCategoryRecord[]>>("/item-categories/");
  return unwrap(response) ?? [];
}

export async function createItemCategory(name: string) {
  const response = await apiClient.post<ApiEnvelope<ItemCategoryRecord>>("/item-categories/", {
    name: name.trim(),
  });
  return unwrap(response);
}

export async function deleteItemCategory(categoryId: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `/item-categories/${categoryId}`
  );
  return unwrap(response);
}
