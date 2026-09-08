import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type SalesDocType =
  | "quotation"
  | "sale_order"
  | "sales_invoice"
  | "payment_in"
  | "sales_return"
  | "delivery_note";

export type SalesDocItem = {
  id?: number;
  item_id?: number | null;
  item_name: string;
  item_code?: string | null;
  unit?: string | null;
  quantity: number | string;
  rate: number | string;
  discount?: number | string;
  tax_percent?: number | string;
  tax_amount?: number | string;
  amount?: number | string;
  reason?: string | null;
  ordered_qty?: number | string | null;
};

export type SalesDocument = {
  id: number;
  user_id?: string;
  doc_type: SalesDocType;
  doc_no?: string | null;
  party_id?: number | null;
  party_name?: string | null;
  doc_date?: string | null;
  due_date?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_mode?: string | null;
  bank_account?: string | null;
  reference_no?: string | null;
  source_doc_id?: number | null;
  source_doc_type?: string | null;
  linked_invoice_id?: number | null;
  notes?: string | null;
  terms?: string | null;
  delivery_address?: string | null;
  transporter?: string | null;
  vehicle_no?: string | null;
  subtotal?: number | string | null;
  discount_total?: number | string | null;
  tax_total?: number | string | null;
  total_amount?: number | string | null;
  received_amount?: number | string | null;
  balance_due?: number | string | null;
  created_at?: string;
  updated_at?: string;
  items?: SalesDocItem[];
};

export type SalesDocPayload = {
  docNo?: string;
  partyId?: number | null;
  partyName?: string;
  docDate?: string;
  dueDate?: string;
  status?: string;
  paymentStatus?: string;
  paymentMode?: string;
  bankAccount?: string;
  referenceNo?: string;
  sourceDocId?: number | null;
  sourceDocType?: string;
  linkedInvoiceId?: number | null;
  notes?: string;
  terms?: string;
  deliveryAddress?: string;
  transporter?: string;
  vehicleNo?: string;
  totalAmount?: number;
  receivedAmount?: number;
  items?: Array<{
    itemId?: number | null;
    itemName: string;
    itemCode?: string;
    unit?: string;
    quantity: number;
    rate: number;
    discount?: number;
    taxPercent?: number;
    reason?: string;
    orderedQty?: number;
  }>;
};

const ENDPOINTS: Record<SalesDocType, string> = {
  quotation: "/quotations",
  sale_order: "/sale-orders",
  sales_invoice: "/sales-invoices",
  payment_in: "/payment-ins",
  sales_return: "/sales-returns",
  delivery_note: "/delivery-notes",
};

function toBody(payload: SalesDocPayload) {
  const body: Record<string, unknown> = {};
  if (payload.docNo !== undefined) body.doc_no = payload.docNo;
  if (payload.partyId !== undefined) body.party_id = payload.partyId;
  if (payload.partyName !== undefined) body.party_name = payload.partyName;
  if (payload.docDate !== undefined) body.doc_date = payload.docDate;
  if (payload.dueDate !== undefined) body.due_date = payload.dueDate;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.paymentStatus !== undefined) body.payment_status = payload.paymentStatus;
  if (payload.paymentMode !== undefined) body.payment_mode = payload.paymentMode;
  if (payload.bankAccount !== undefined) body.bank_account = payload.bankAccount;
  if (payload.referenceNo !== undefined) body.reference_no = payload.referenceNo;
  if (payload.sourceDocId !== undefined) body.source_doc_id = payload.sourceDocId;
  if (payload.sourceDocType !== undefined) body.source_doc_type = payload.sourceDocType;
  if (payload.linkedInvoiceId !== undefined) body.linked_invoice_id = payload.linkedInvoiceId;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.terms !== undefined) body.terms = payload.terms;
  if (payload.deliveryAddress !== undefined) body.delivery_address = payload.deliveryAddress;
  if (payload.transporter !== undefined) body.transporter = payload.transporter;
  if (payload.vehicleNo !== undefined) body.vehicle_no = payload.vehicleNo;
  if (payload.totalAmount !== undefined) body.total_amount = payload.totalAmount;
  if (payload.receivedAmount !== undefined) body.received_amount = payload.receivedAmount;
  if (payload.items !== undefined) {
    body.items = payload.items.map((item) => ({
      item_id: item.itemId ?? null,
      item_name: item.itemName,
      item_code: item.itemCode,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount ?? 0,
      tax_percent: item.taxPercent ?? 0,
      reason: item.reason,
      ordered_qty: item.orderedQty,
    }));
  }
  return body;
}

export async function getSalesDocuments(
  docType: SalesDocType,
  params?: { search?: string; status?: string }
) {
  const response = await apiClient.get<ApiEnvelope<SalesDocument[]>>(ENDPOINTS[docType] + "/", {
    params,
  });
  return unwrap(response) ?? [];
}

export async function getSalesDocument(docType: SalesDocType, id: number) {
  const response = await apiClient.get<ApiEnvelope<SalesDocument>>(`${ENDPOINTS[docType]}/${id}`);
  return unwrap(response);
}

export async function createSalesDocument(docType: SalesDocType, payload: SalesDocPayload) {
  const response = await apiClient.post<ApiEnvelope<SalesDocument>>(
    ENDPOINTS[docType] + "/",
    toBody(payload)
  );
  return unwrap(response);
}

export async function updateSalesDocument(
  docType: SalesDocType,
  id: number,
  payload: SalesDocPayload
) {
  const response = await apiClient.patch<ApiEnvelope<SalesDocument>>(
    `${ENDPOINTS[docType]}/${id}`,
    toBody(payload)
  );
  return unwrap(response);
}

export async function deleteSalesDocument(docType: SalesDocType, id: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${ENDPOINTS[docType]}/${id}`
  );
  return unwrap(response);
}

export async function getNextSalesDocNo(docType: SalesDocType) {
  const response = await apiClient.get<ApiEnvelope<{ doc_no: string }>>(
    `${ENDPOINTS[docType]}/next-number`
  );
  return unwrap(response)?.doc_no || "";
}

export async function convertSalesDocument(
  docType: SalesDocType,
  id: number,
  targetDocType: SalesDocType
) {
  const response = await apiClient.post<ApiEnvelope<SalesDocument>>(
    `${ENDPOINTS[docType]}/${id}/convert`,
    { target_doc_type: targetDocType }
  );
  return unwrap(response);
}
