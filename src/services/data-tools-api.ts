import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type FinancialYear = {
  label: string;
  start_date: string;
  end_date: string;
  status: "closed" | "ended" | "current";
  closed_at: string | null;
  can_close: boolean;
  can_reopen: boolean;
  totals: { sales: number; purchases: number; expenses: number; other_income: number; net_profit: number };
};

export type FinancialYearsResponse = { lock_date: string | null; start_month: number; years: FinancialYear[] };

export type BinEntry = {
  id: number;
  entity_type: string;
  entity_id: number;
  kind: string;
  label: string | null;
  amount: number | string | null;
  entry_date: string | null;
  deleted_at: string;
  days_left: number;
};

export type BackupFile = {
  format: string;
  version: number;
  user_id: string;
  created_at: string;
  counts: Record<string, number>;
  tables: Record<string, unknown[]>;
};

export async function getFinancialYears() {
  return unwrap(await apiClient.get<ApiEnvelope<FinancialYearsResponse>>("/data-tools/financial-years"));
}

export async function closeFinancialYear(startDate: string, endDate: string) {
  await apiClient.post("/data-tools/financial-years/close", { start_date: startDate, end_date: endDate });
}

export async function reopenFinancialYear() {
  await apiClient.post("/data-tools/financial-years/reopen");
}

export async function getRecycleBin() {
  return unwrap(await apiClient.get<ApiEnvelope<BinEntry[]>>("/data-tools/recycle-bin")) ?? [];
}

export async function restoreBinEntry(id: number) {
  const response = await apiClient.post<ApiEnvelope<Record<string, never>>>(`/data-tools/recycle-bin/${id}/restore`);
  return response.data.message;
}

export async function deleteBinEntry(id: number) {
  await apiClient.delete(`/data-tools/recycle-bin/${id}`);
}

export async function emptyRecycleBin() {
  await apiClient.delete("/data-tools/recycle-bin");
}

/** Downloads the backup JSON (authenticated) as a Blob. */
export async function downloadBackup() {
  const response = await apiClient.get<Blob>("/data-tools/backup", { responseType: "blob" });
  return response.data;
}

export async function emailBackup() {
  const response = await apiClient.post<ApiEnvelope<{ email: string }>>("/data-tools/backup/email");
  return unwrap(response)?.email ?? "";
}

export async function restoreBackup(backup: BackupFile) {
  const response = await apiClient.post<ApiEnvelope<{ restored: Record<string, number> }>>("/data-tools/restore", backup);
  return unwrap(response)?.restored ?? {};
}
