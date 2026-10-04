import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type OtherIncome = {
  id: number;
  income_no: string;
  income_date: string;
  category: string;
  amount: number | string;
  payment_mode: string;
  bank_account?: string | null;
  notes?: string | null;
};

export type OtherIncomePayload = {
  incomeDate: string;
  category: string;
  amount: number;
  paymentMode: string;
  bankAccount?: string;
  notes?: string;
};

const body = (p: OtherIncomePayload) => ({
  income_date: p.incomeDate,
  category: p.category.trim(),
  amount: p.amount,
  payment_mode: p.paymentMode,
  bank_account: p.bankAccount || "",
  notes: p.notes || "",
});

export async function getOtherIncomes() {
  return unwrap(await apiClient.get<ApiEnvelope<OtherIncome[]>>("/other-income")) ?? [];
}

export async function getNextOtherIncomeNo() {
  return unwrap(await apiClient.get<ApiEnvelope<{ income_no: string }>>("/other-income/next-number"))?.income_no ?? "";
}

export async function createOtherIncome(payload: OtherIncomePayload) {
  return unwrap(await apiClient.post<ApiEnvelope<OtherIncome>>("/other-income", body(payload)));
}

export async function updateOtherIncome(id: number, payload: OtherIncomePayload) {
  return unwrap(await apiClient.patch<ApiEnvelope<OtherIncome>>(`/other-income/${id}`, body(payload)));
}

export async function deleteOtherIncome(id: number) {
  await apiClient.delete(`/other-income/${id}`);
}
