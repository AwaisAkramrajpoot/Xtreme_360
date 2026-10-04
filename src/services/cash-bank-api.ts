import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type AccountType = "bank" | "loan";

export type BankAccount = {
  id: number;
  account_type: AccountType;
  account_name: string;
  bank_name?: string | null;
  account_number?: string | null;
  opening_balance?: number | string | null;
  as_of_date?: string | null;
  notes?: string | null;
  current_balance: number | string;
};

export type AccountPayload = {
  accountType?: AccountType;
  accountName: string;
  bankName?: string;
  accountNumber?: string;
  openingBalance?: number | string;
  asOfDate?: string;
  notes?: string;
};

export type TxnType = "bank_to_cash" | "cash_to_bank" | "bank_to_bank" | "adjust_bank" | "adjust_cash";

export type CashBankTransaction = {
  id: number;
  txn_type: TxnType;
  from_account_id?: number | null;
  to_account_id?: number | null;
  from_account_name?: string | null;
  to_account_name?: string | null;
  amount: number | string;
  txn_date: string;
  description?: string | null;
};

export type TransactionPayload = {
  txnType: TxnType;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  amount: number;
  direction?: "add" | "reduce";
  txnDate?: string;
  description?: string;
};

export type CashLedgerEntry = {
  source: string;
  ref_id: string;
  entry_date: string | null;
  description: string;
  amount: number | string;
};

export type Cheque = {
  id: number;
  doc_type: "payment_in" | "payment_out";
  doc_no?: string | null;
  party_name?: string | null;
  doc_date?: string | null;
  total_amount: number | string;
  reference_no?: string | null;
  bank_account?: string | null;
  status?: string | null;
};

const accountBody = (p: AccountPayload) => ({
  account_type: p.accountType,
  account_name: p.accountName.trim(),
  bank_name: p.bankName,
  account_number: p.accountNumber,
  opening_balance: p.openingBalance === "" ? undefined : p.openingBalance,
  as_of_date: p.asOfDate || undefined,
  notes: p.notes,
});

export async function getAccounts(type?: AccountType) {
  const response = await apiClient.get<ApiEnvelope<BankAccount[]>>("/cash-bank/accounts", {
    params: type ? { type } : undefined,
  });
  return unwrap(response) ?? [];
}

export async function createAccount(payload: AccountPayload) {
  const response = await apiClient.post<ApiEnvelope<BankAccount>>("/cash-bank/accounts", accountBody(payload));
  return unwrap(response);
}

export async function updateAccount(id: number, payload: AccountPayload) {
  const response = await apiClient.patch<ApiEnvelope<BankAccount>>(`/cash-bank/accounts/${id}`, accountBody(payload));
  return unwrap(response);
}

export async function deleteAccount(id: number) {
  await apiClient.delete(`/cash-bank/accounts/${id}`);
}

export async function getTransactions(type?: TxnType) {
  const response = await apiClient.get<ApiEnvelope<CashBankTransaction[]>>("/cash-bank/transactions", {
    params: type ? { type } : undefined,
  });
  return unwrap(response) ?? [];
}

export async function createTransaction(payload: TransactionPayload) {
  const response = await apiClient.post<ApiEnvelope<CashBankTransaction>>("/cash-bank/transactions", {
    txn_type: payload.txnType,
    from_account_id: payload.fromAccountId ?? undefined,
    to_account_id: payload.toAccountId ?? undefined,
    amount: payload.amount,
    direction: payload.direction,
    txn_date: payload.txnDate || undefined,
    description: payload.description,
  });
  return unwrap(response);
}

export async function deleteTransaction(id: number) {
  await apiClient.delete(`/cash-bank/transactions/${id}`);
}

export async function getCashInHand() {
  const response = await apiClient.get<ApiEnvelope<{ balance: number; entries: CashLedgerEntry[] }>>(
    "/cash-bank/cash-in-hand"
  );
  return unwrap(response) ?? { balance: 0, entries: [] };
}

export async function getCheques() {
  const response = await apiClient.get<ApiEnvelope<Cheque[]>>("/cash-bank/cheques");
  return unwrap(response) ?? [];
}
