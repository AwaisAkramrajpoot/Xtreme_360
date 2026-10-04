import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";
import type { ItemRecord, ItemCategoryRecord } from "@/services/item-api";
import type { PartyRecord } from "@/services/party-api";
import type { SalesDocument, SalesDocItem } from "@/services/sales-api";

export type PosOrderType = "take_away" | "dine_in" | "delivery";

export type PosPaymentLine = {
  mode: string;
  amount: number;
};

export type PosCatalog = {
  products: ItemRecord[];
  categories: ItemCategoryRecord[];
  parties: PartyRecord[];
  settings: {
    enableTax: boolean;
    enableDiscount: boolean;
  };
};

/** Kitchen / counter progress of an order. "held" bills are open (unpaid) orders. */
export type PosOrderStatus = "new" | "preparing" | "ready" | "served" | "out_for_delivery" | "completed" | "cancelled";

export type PosDelivery = {
  phone: string;
  address: string;
  charges: number;
  rider?: string | null;
  instructions?: string | null;
};

export type PosBill = SalesDocument & {
  channel?: string | null;
  order_type?: string | null;
  payments_json?: string | null;
  payments?: PosPaymentLine[];
  items?: SalesDocItem[];
  table_id?: number | null;
  table_name?: string | null;
  guests?: number | null;
  reservation_id?: number | null;
  order_status?: PosOrderStatus | null;
  pos_meta?: { customer_phone?: string | null; delivery?: PosDelivery | null } | null;
  created_at?: string;
  /** When the order was opened, as a real instant (use this rather than created_at). */
  opened_at?: string | null;
};

export type PosTableStatus = "free" | "occupied" | "reserved";

export type PosTable = {
  id: number;
  name: string;
  area: string | null;
  capacity: number;
  sort_order: number;
  is_active: boolean;
  status: PosTableStatus;
  order_id: number | null;
  order_no: string | null;
  order_total: number | null;
  order_guests: number | null;
  order_status: PosOrderStatus | null;
  order_party: string | null;
  order_opened_at: string | null;
  seated_reservation_id: number | null;
  seated_customer: string | null;
  reservation_id: number | null;
  reservation_customer: string | null;
  reservation_phone: string | null;
  reservation_time: string | null;
  reservation_guests: number | null;
  reservation_due: boolean;
};

export type PosReservationStatus = "booked" | "seated" | "completed" | "cancelled" | "no_show";

export type PosReservation = {
  id: number;
  table_id: number | null;
  table_name: string | null;
  table_area: string | null;
  table_capacity: number | null;
  party_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: PosReservationStatus;
  notes: string | null;
  order_id: number | null;
  seated_at: string | null;
};

export type PosReservationPayload = {
  customer_name: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  table_id?: number | null;
  party_id?: number | null;
  notes?: string;
};

export type PosSalePayload = {
  billId?: number | null;
  docNo?: string;
  partyId?: number | null;
  partyName?: string;
  docDate?: string;
  orderType?: PosOrderType;
  /** Dine-in only. */
  tableId?: number | null;
  guests?: number | null;
  reservationId?: number | null;
  /** Kitchen status to store; checkout defaults to "completed". */
  orderStatus?: PosOrderStatus;
  customerPhone?: string;
  /** Delivery only; the charge is added to the bill by the server. */
  delivery?: PosDelivery | null;
  notes?: string;
  receivedAmount?: number;
  payments?: PosPaymentLine[];
  items: Array<{
    itemId?: number | null;
    itemName: string;
    itemCode?: string;
    unit?: string;
    quantity: number;
    rate: number;
    discount?: number;
    taxPercent?: number;
    /** Kitchen note, e.g. "no onions". */
    note?: string;
  }>;
};

export async function getPosCatalog() {
  const response = await apiClient.get<ApiEnvelope<PosCatalog>>("/pos/catalog");
  return unwrap(response);
}

export async function getNextPosBillNo() {
  const response = await apiClient.get<ApiEnvelope<{ doc_no: string }>>("/pos/next-bill");
  const data = unwrap(response);
  return data?.doc_no || "";
}

export async function getPosBills(params?: { status?: string; search?: string }) {
  const response = await apiClient.get<ApiEnvelope<PosBill[]>>("/pos/bills", { params });
  return unwrap(response) ?? [];
}

export async function getPosBill(id: number) {
  const response = await apiClient.get<ApiEnvelope<PosBill>>(`/pos/bills/${id}`);
  return unwrap(response);
}

export async function checkoutPosSale(payload: PosSalePayload) {
  const response = await apiClient.post<ApiEnvelope<PosBill>>("/pos/checkout", payload);
  return unwrap(response);
}

export async function holdPosSale(payload: PosSalePayload) {
  const response = await apiClient.post<ApiEnvelope<PosBill>>("/pos/hold", payload);
  return unwrap(response);
}

export async function deleteHeldPosBill(id: number) {
  const response = await apiClient.delete<ApiEnvelope<unknown>>(`/pos/bills/${id}`);
  return unwrap(response);
}

/* ---------------- restaurant: tables, reservations, orders ---------------- */

/** The cashier's local date and time, which decide whether a table counts as reserved now. */
export function localClock(at = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
  };
}

export async function getPosTables(options: { all?: boolean } = {}) {
  const response = await apiClient.get<ApiEnvelope<PosTable[]>>("/pos/tables", {
    params: { ...localClock(), ...(options.all ? { all: 1 } : {}) },
  });
  return unwrap(response) ?? [];
}

export async function savePosTable(id: number | null, payload: { name?: string; area?: string; capacity?: number; is_active?: boolean }) {
  const response = id
    ? await apiClient.patch<ApiEnvelope<PosTable>>(`/pos/tables/${id}`, payload)
    : await apiClient.post<ApiEnvelope<PosTable>>("/pos/tables", payload);
  return unwrap(response);
}

export async function deletePosTable(id: number) {
  await apiClient.delete(`/pos/tables/${id}`);
}

export async function getPosReservations(params: { date?: string; from?: string; to?: string; status?: string }) {
  const response = await apiClient.get<ApiEnvelope<PosReservation[]>>("/pos/reservations", { params });
  return unwrap(response) ?? [];
}

export async function savePosReservation(id: number | null, payload: PosReservationPayload) {
  const response = id
    ? await apiClient.patch<ApiEnvelope<PosReservation>>(`/pos/reservations/${id}`, payload)
    : await apiClient.post<ApiEnvelope<PosReservation>>("/pos/reservations", payload);
  return unwrap(response);
}

export async function setPosReservationStatus(id: number, status: PosReservationStatus, tableId?: number | null) {
  const response = await apiClient.post<ApiEnvelope<PosReservation>>(`/pos/reservations/${id}/status`, {
    status,
    ...(tableId ? { table_id: tableId } : {}),
  });
  return unwrap(response);
}

export async function deletePosReservation(id: number) {
  await apiClient.delete(`/pos/reservations/${id}`);
}

export async function getActivePosOrders() {
  const response = await apiClient.get<ApiEnvelope<PosBill[]>>("/pos/orders/active");
  return unwrap(response) ?? [];
}

export async function setPosOrderStatus(id: number, orderStatus: PosOrderStatus) {
  const response = await apiClient.patch<ApiEnvelope<{ id: number; order_status: PosOrderStatus }>>(`/pos/orders/${id}/status`, {
    order_status: orderStatus,
  });
  return unwrap(response);
}
