import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type ExpenseCategoryRecord = {
  id: number;
  user_id?: string;
  name: string;
  created_at?: string;
};

export type ExpenseRecord = {
  id: number;
  user_id?: string;
  expense_no?: string | null;
  date?: string | null;
  category?: string | null;
  total_amount?: number | string | null;
  notes?: string | null;
  /** Cash, Bank, Cheque or Online; missing on older expenses, which count as Cash. */
  payment_mode?: string | null;
  bank_account?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateExpensePayload = {
  expenseNo?: string;
  date?: string;
  category?: string | null;
  totalAmount?: string | number;
  notes?: string;
  paymentMode?: string;
  bankAccount?: string;
};

export const EXPENSE_PAYMENT_MODES = ["Cash", "Bank", "Cheque", "Online"];

/* ---- categories ---- */

export async function getExpenseCategories() {
  const response = await apiClient.get<ApiEnvelope<ExpenseCategoryRecord[]>>("/expenses/categories");
  return unwrap(response) ?? [];
}

export async function createExpenseCategory(name: string) {
  const response = await apiClient.post<ApiEnvelope<ExpenseCategoryRecord>>(
    "/expenses/categories",
    { name: name.trim() }
  );
  return unwrap(response);
}

export async function deleteExpenseCategory(categoryId: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `/expenses/categories/${categoryId}`
  );
  return unwrap(response);
}

/* ---- expenses ---- */

export async function getNextExpenseNo() {
  const response = await apiClient.get<ApiEnvelope<{ expense_no: string }>>("/expenses/next-number");
  return unwrap(response)?.expense_no ?? "";
}

export async function getExpenses() {
  const response = await apiClient.get<ApiEnvelope<ExpenseRecord[]>>("/expenses/");
  return unwrap(response) ?? [];
}

export async function createExpense(payload: CreateExpensePayload) {
  const body: Record<string, string | number> = {};
  if (payload.expenseNo) body.expense_no = payload.expenseNo;
  if (payload.date) body.date = payload.date;
  if (payload.category) body.category = payload.category;
  if (payload.totalAmount !== undefined && payload.totalAmount !== "")
    body.total_amount = Number(payload.totalAmount);
  if (payload.notes) body.notes = payload.notes;
  if (payload.paymentMode) body.payment_mode = payload.paymentMode;
  if (payload.bankAccount !== undefined) body.bank_account = payload.bankAccount;

  const response = await apiClient.post<ApiEnvelope<ExpenseRecord>>("/expenses/", body);
  return unwrap(response);
}

export async function updateExpense(expenseId: number, payload: CreateExpensePayload) {
  const body: Record<string, string | number> = {};
  if (payload.expenseNo !== undefined) body.expense_no = payload.expenseNo;
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.category !== undefined && payload.category !== null) body.category = payload.category;
  if (payload.totalAmount !== undefined && payload.totalAmount !== "")
    body.total_amount = Number(payload.totalAmount);
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.paymentMode) body.payment_mode = payload.paymentMode;
  if (payload.bankAccount !== undefined) body.bank_account = payload.bankAccount;

  const response = await apiClient.patch<ApiEnvelope<ExpenseRecord>>(
    `/expenses/${expenseId}`,
    body
  );
  return unwrap(response);
}

export async function deleteExpense(expenseId: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `/expenses/${expenseId}`
  );
  return unwrap(response);
}
