"use client";

import { useCallback, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { IconButton } from "@/components/ui/IconButton";
import { AppButton } from "@/components/ui/AppButton";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { formatMoney } from "@/constants/app-settings";
import { useToast } from "@/hooks/use-toast";
import { useAsyncData } from "@/hooks/use-async-data";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";
import {
  createAccount,
  createTransaction,
  deleteAccount,
  deleteTransaction,
  getAccounts,
  getCashInHand,
  getCheques,
  getTransactions,
  updateAccount,
  type AccountType,
  type BankAccount,
  type CashBankTransaction,
  type CashLedgerEntry,
  type Cheque,
  type TxnType,
} from "@/services/cash-bank-api";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function useMoney() {
  const general = useSettingsStore((s) => s.app.general);
  return useCallback((value: number | string | null | undefined) => formatMoney(value, general), [general]);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : String(value);
}

function ListState({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="col-span-full space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="col-span-full flex flex-col items-center gap-3 py-10 text-sm text-red-500">
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg px-4 py-2 font-semibold text-white"
          style={{ backgroundColor: AppColors.primary }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <p className="col-span-full py-10 text-center text-sm" style={{ color: AppColors.grey }}>
        {emptyText}
      </p>
    );
  }
  return null;
}

const cardClass =
  "rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] lg:p-5";
const cardStyle = { borderColor: AppColors.lightGrey, boxShadow: "0 2px 10px rgba(15,23,42,0.04)" };

/* ------------------------------------------------------------------ */
/* Account modal (bank + loan)                                         */
/* ------------------------------------------------------------------ */

function AccountModal({
  type,
  initial,
  onClose,
  onSaved,
}: {
  type: AccountType;
  initial: BankAccount | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isLoan = type === "loan";
  const [name, setName] = useState(initial?.account_name ?? "");
  const [bankName, setBankName] = useState(initial?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.account_number ?? "");
  const [opening, setOpening] = useState(initial ? String(initial.opening_balance ?? "") : "");
  const [asOfDate, setAsOfDate] = useState(initial?.as_of_date ? String(initial.as_of_date).slice(0, 10) : today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) return setError(isLoan ? "Enter a loan name" : "Enter an account name");
    if (opening.trim() && !Number.isFinite(Number(opening))) return setError("Amount must be a number");
    setSaving(true);
    setError("");
    const payload = {
      accountType: type,
      accountName: name,
      bankName,
      accountNumber,
      openingBalance: opening.trim() ? Number(opening) : 0,
      asOfDate,
    };
    try {
      if (initial) await updateAccount(initial.id, payload);
      else await createAccount(payload);
      onSaved(initial ? "Account updated" : isLoan ? "Loan added" : "Bank account added");
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save account"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={initial ? "Edit Account" : isLoan ? "Add Loan Account" : "Add Bank Account"}
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} isLoading={saving} />}
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <AppTextField title="As of Date" hintText="yyyy-mm-dd" value={asOfDate} onChange={setAsOfDate} isDateField />
        <AppTextField
          title={isLoan ? "Loan Name" : "Account Display Name"}
          hintText={isLoan ? "e.g. Business Loan" : "e.g. HBL Current"}
          value={name}
          onChange={setName}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title={isLoan ? "Lender" : "Bank Name"} hintText="Optional" value={bankName} onChange={setBankName} />
          <AppTextField title="Account Number" hintText="Optional" value={accountNumber} onChange={setAccountNumber} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField
            title={isLoan ? "Loan Amount" : "Opening Balance"}
            hintText="0.00"
            type="number"
            value={opening}
            onChange={setOpening}
          />
        </div>
      </div>
    </AppModal>
  );
}

/* ------------------------------------------------------------------ */
/* Transaction modal (transfers, adjustments, loan repayment)          */
/* ------------------------------------------------------------------ */

const TXN_META: Record<TxnType, { title: string; from?: string; to?: string; adjust?: boolean }> = {
  bank_to_cash: { title: "Bank to Cash Transfer", from: "From Bank Account" },
  cash_to_bank: { title: "Cash to Bank Transfer", to: "To Bank Account" },
  bank_to_bank: { title: "Bank to Bank Transfer", from: "From Bank Account", to: "To Bank Account" },
  adjust_bank: { title: "Adjust Bank Balance", to: "Account", adjust: true },
  adjust_cash: { title: "Adjust Cash", adjust: true },
};

function TransactionForm({
  type,
  accounts,
  presetAccountId,
  onSaved,
  onCancel,
  submitLabel = "Save",
}: {
  type: TxnType;
  accounts: BankAccount[];
  presetAccountId?: number;
  onSaved: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const meta = TXN_META[type];
  const accountKey = (a: BankAccount) => `${a.id}::${a.account_name}`;
  const options = accounts.map(accountKey);
  const preset = accounts.find((a) => a.id === presetAccountId);
  const [fromKey, setFromKey] = useState<string | null>(null);
  const [toKey, setToKey] = useState<string | null>(preset ? accountKey(preset) : null);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"Add" | "Reduce">(presetAccountId ? "Reduce" : "Add");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const idOf = (key: string | null) => (key ? Number(key.split("::")[0]) : null);

  const submit = async () => {
    const value = Number(amount);
    if (meta.from && !fromKey) return setError(`Select ${meta.from.toLowerCase()}`);
    if (meta.to && !toKey) return setError(`Select ${meta.to.toLowerCase()}`);
    if (fromKey && fromKey === toKey) return setError("Choose two different accounts");
    if (!(value > 0)) return setError("Enter an amount greater than 0");
    setSaving(true);
    setError("");
    try {
      await createTransaction({
        txnType: type,
        fromAccountId: idOf(fromKey),
        toAccountId: idOf(toKey),
        amount: value,
        direction: meta.adjust ? (direction === "Add" ? "add" : "reduce") : undefined,
        txnDate: date,
        description,
      });
      setAmount("");
      setDescription("");
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save transaction"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {(meta.from || meta.to) && !accounts.length && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }}>
          Add a bank account first (Cash &amp; Bank › Bank Account).
        </p>
      )}
      <AppTextField title="Date" hintText="yyyy-mm-dd" value={date} onChange={setDate} isDateField />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {meta.from && (
          <AppDropDown
            title={meta.from}
            items={options}
            value={fromKey}
            onChange={setFromKey}
            hintText="Select account"
            getLabel={(v) => v.split("::").slice(1).join("::")}
          />
        )}
        {meta.to && !presetAccountId && (
          <AppDropDown
            title={meta.to}
            items={options}
            value={toKey}
            onChange={setToKey}
            hintText="Select account"
            getLabel={(v) => v.split("::").slice(1).join("::")}
          />
        )}
        {meta.adjust && !presetAccountId && (
          <AppDropDown title="Type" items={["Add", "Reduce"] as ("Add" | "Reduce")[]} value={direction} onChange={setDirection} />
        )}
        <AppTextField title="Amount" hintText="0.00" type="number" value={amount} onChange={setAmount} />
      </div>
      <AppTextField title="Description" hintText="Optional" value={description} onChange={setDescription} />
      {onCancel ? (
        <FormButtonsRow onCancel={onCancel} onSave={() => void submit()} saveLabel={submitLabel} isLoading={saving} />
      ) : (
        <AppButton text={submitLabel} isLoading={saving} onClick={() => void submit()} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bank accounts + loans                                               */
/* ------------------------------------------------------------------ */

function AccountListScreen({ type, openAdd = false }: { type: AccountType; openAdd?: boolean }) {
  const isLoan = type === "loan";
  const money = useMoney();
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const loader = useCallback(() => getAccounts(type), [type]);
  const { data: accounts, loading, error, reload } = useAsyncData(loader, [] as BankAccount[]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [modalOpen, setModalOpen] = useState(openAdd);
  const [repaying, setRepaying] = useState<BankAccount | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) =>
      [a.account_name, a.bank_name, a.account_number].some((v) => v && v.toLowerCase().includes(q))
    );
  }, [accounts, search]);

  const total = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

  const remove = async (account: BankAccount) => {
    const ok = await confirm({
      title: "Delete account",
      message: `Delete "${account.account_name}"? Its transfers and adjustments are deleted too.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAccount(account.id);
      showToast("Account deleted");
      await reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete account"), "error");
    }
  };

  return (
    <div className="flex flex-col">
      <AppAppBar
        title={isLoan ? "Loan Accounts" : "Bank Accounts"}
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts"
      />

      {!loading && !error && accounts.length > 0 && (
        <div className="mb-4 rounded-2xl p-5 text-white" style={{ backgroundColor: AppColors.primary }}>
          <p className="text-sm opacity-90">{isLoan ? "Total outstanding loans" : "Total bank balance"}</p>
          <p className="mt-1 text-2xl font-bold">{money(total)}</p>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 pb-20 sm:gap-4 md:grid-cols-2 md:pb-4">
        <ListState
          loading={loading}
          error={error}
          empty={!filtered.length}
          emptyText={
            accounts.length
              ? "No accounts match your search."
              : isLoan
                ? "No loan accounts yet. Tap + to add one."
                : "No bank accounts yet. Tap + to add one."
          }
          onRetry={() => void reload()}
        />
        {!loading &&
          !error &&
          filtered.map((account) => (
            <div key={account.id} className={cardClass} style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-black">{account.account_name}</p>
                  <p className="mt-0.5 truncate text-sm" style={{ color: AppColors.grey }}>
                    {[account.bank_name, account.account_number].filter(Boolean).join(" · ") || (isLoan ? "Loan" : "Bank account")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isLoan && <IconButton icon="payments" label="Record repayment" onClick={() => setRepaying(account)} />}
                  <IconButton icon="edit" label="Edit" variant="edit" onClick={() => { setEditing(account); setModalOpen(true); }} />
                  <IconButton icon="delete" label="Delete" variant="delete" onClick={() => void remove(account)} />
                </div>
              </div>
              <p
                className="mt-3 text-lg font-semibold"
                style={{ color: Number(account.current_balance) < 0 ? AppColors.redText : isLoan ? AppColors.redText : AppColors.greenText }}
              >
                {money(account.current_balance)}
              </p>
              <p className="text-xs" style={{ color: AppColors.grey }}>
                {isLoan ? "Outstanding" : "Current balance"}
              </p>
            </div>
          ))}
      </div>

      <FloatingActionButton onClick={() => { setEditing(null); setModalOpen(true); }} />

      {modalOpen && (
        <AccountModal
          type={type}
          initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={(message) => { showToast(message); void reload(); }}
        />
      )}

      {repaying && (
        <AppModal open onClose={() => setRepaying(null)} title={`Repay ${repaying.account_name}`} size="md">
          <TransactionForm
            type="adjust_bank"
            accounts={[repaying]}
            presetAccountId={repaying.id}
            submitLabel="Record Repayment"
            onCancel={() => setRepaying(null)}
            onSaved={() => { setRepaying(null); showToast("Repayment recorded"); void reload(); }}
          />
        </AppModal>
      )}
      {Toast}
    </div>
  );
}

export function BankAccountScreen({ openAdd = false }: { openAdd?: boolean }) {
  return <AccountListScreen type="bank" openAdd={openAdd} />;
}

export function LoanAmountScreen() {
  return <AccountListScreen type="loan" />;
}

/* ------------------------------------------------------------------ */
/* Transfers and bank adjustments                                      */
/* ------------------------------------------------------------------ */

export function TransferScreen({ type }: { type: Exclude<TxnType, "adjust_cash"> }) {
  const meta = TXN_META[type];
  const money = useMoney();
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const accountsLoader = useCallback(() => getAccounts("bank"), []);
  const historyLoader = useCallback(() => getTransactions(type), [type]);
  const accounts = useAsyncData(accountsLoader, [] as BankAccount[]);
  const history = useAsyncData(historyLoader, [] as CashBankTransaction[]);

  const remove = async (txn: CashBankTransaction) => {
    const ok = await confirm({ title: "Delete entry", message: "Delete this entry?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteTransaction(txn.id);
      showToast("Entry deleted");
      void history.reload();
      void accounts.reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete entry"), "error");
    }
  };

  const describe = (t: CashBankTransaction) => {
    if (type === "bank_to_cash") return `${t.from_account_name ?? "Bank"} → Cash`;
    if (type === "cash_to_bank") return `Cash → ${t.to_account_name ?? "Bank"}`;
    if (type === "bank_to_bank") return `${t.from_account_name ?? "Bank"} → ${t.to_account_name ?? "Bank"}`;
    return t.to_account_name ?? "Account";
  };

  return (
    <div className="flex flex-col">
      <AppAppBar title={meta.title} showBack />
      <div className="grid gap-4 pb-20 lg:grid-cols-5 md:pb-4">
        <section className={`${cardClass} lg:col-span-2 self-start`} style={cardStyle}>
          <h2 className="mb-4 text-base font-bold text-black">New entry</h2>
          {accounts.loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-[#F4F4F4]" />
          ) : (
            <TransactionForm
              type={type}
              accounts={accounts.data}
              onSaved={() => { showToast("Saved"); void history.reload(); void accounts.reload(); }}
            />
          )}
        </section>

        <section className="lg:col-span-3 space-y-3">
          <h2 className="text-base font-bold text-black">History</h2>
          <ListState
            loading={history.loading}
            error={history.error}
            empty={!history.data.length}
            emptyText="No entries yet."
            onRetry={() => void history.reload()}
          />
          {!history.loading &&
            !history.error &&
            history.data.map((t) => (
              <div key={t.id} className={`${cardClass} flex items-center gap-3`} style={cardStyle}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black">{describe(t)}</p>
                  <p className="truncate text-xs" style={{ color: AppColors.grey }}>
                    {formatDate(t.txn_date)}
                    {t.description ? ` · ${t.description}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold" style={{ color: Number(t.amount) < 0 ? AppColors.redText : AppColors.black }}>
                  {money(t.amount)}
                </p>
                <IconButton icon="delete" label="Delete" variant="delete" onClick={() => void remove(t)} />
              </div>
            ))}
        </section>
      </div>
      {Toast}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cash in hand                                                        */
/* ------------------------------------------------------------------ */

const DELETABLE_SOURCES = ["bank_to_cash", "cash_to_bank", "adjust_cash"];

export function CashInHandScreen() {
  const money = useMoney();
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const loader = useCallback(() => getCashInHand(), []);
  const { data, loading, error, reload } = useAsyncData(loader, { balance: 0, entries: [] as CashLedgerEntry[] });
  const [adjusting, setAdjusting] = useState(false);

  const remove = async (entry: CashLedgerEntry) => {
    const ok = await confirm({ title: "Delete entry", message: "Delete this cash entry?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteTransaction(Number(entry.ref_id));
      showToast("Entry deleted");
      void reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete entry"), "error");
    }
  };

  return (
    <div className="flex flex-col">
      <AppAppBar title="Cash in Hand" showBack />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white" style={{ backgroundColor: AppColors.primary }}>
        <div>
          <p className="text-sm opacity-90">Current cash balance</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : money(data.balance)}</p>
        </div>
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold"
          style={{ color: AppColors.primary }}
        >
          Adjust Cash
        </button>
      </div>

      <div className="space-y-3 pb-20 md:pb-4">
        <ListState
          loading={loading}
          error={error}
          empty={!data.entries.length}
          emptyText="No cash movements yet. Cash payments, POS cash sales, expenses and transfers appear here."
          onRetry={() => void reload()}
        />
        {!loading &&
          !error &&
          data.entries.map((entry) => {
            const amount = Number(entry.amount || 0);
            return (
              <div key={`${entry.source}-${entry.ref_id}`} className={`${cardClass} flex items-center gap-3`} style={cardStyle}>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: amount >= 0 ? "#EAF6EA" : "#FDECEC", color: amount >= 0 ? AppColors.greenText : AppColors.redText }}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>{amount >= 0 ? "south_west" : "north_east"}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black">{entry.description}</p>
                  <p className="text-xs" style={{ color: AppColors.grey }}>{formatDate(entry.entry_date)}</p>
                </div>
                <p className="shrink-0 font-semibold" style={{ color: amount >= 0 ? AppColors.greenText : AppColors.redText }}>
                  {amount >= 0 ? "+" : "−"} {money(Math.abs(amount))}
                </p>
                {DELETABLE_SOURCES.includes(entry.source) && (
                  <IconButton icon="delete" label="Delete" variant="delete" onClick={() => void remove(entry)} />
                )}
              </div>
            );
          })}
      </div>

      {adjusting && (
        <AppModal open onClose={() => setAdjusting(false)} title="Adjust Cash" size="md">
          <TransactionForm
            type="adjust_cash"
            accounts={[]}
            onCancel={() => setAdjusting(false)}
            onSaved={() => { setAdjusting(false); showToast("Cash adjusted"); void reload(); }}
          />
        </AppModal>
      )}
      {Toast}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cheques                                                             */
/* ------------------------------------------------------------------ */

const CHEQUE_TABS = ["Received", "Paid"] as const;

export function ChequeScreen() {
  const money = useMoney();
  const [tab, setTab] = useState<(typeof CHEQUE_TABS)[number]>("Received");
  const loader = useCallback(() => getCheques(), []);
  const { data, loading, error, reload } = useAsyncData(loader, [] as Cheque[]);
  const visible = data.filter((c) => (tab === "Received" ? c.doc_type === "payment_in" : c.doc_type === "payment_out"));

  return (
    <div className="flex flex-col">
      <AppAppBar title="Cheques" showBack />
      <div role="tablist" className="mb-4 grid grid-cols-2 rounded-xl border bg-white p-1" style={{ borderColor: AppColors.lightGrey }}>
        {CHEQUE_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="rounded-lg py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: tab === t ? AppColors.primary : "transparent", color: tab === t ? AppColors.white : AppColors.black }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 pb-20 md:grid-cols-2 md:pb-4">
        <ListState
          loading={loading}
          error={error}
          empty={!visible.length}
          emptyText={`No cheque payments ${tab === "Received" ? "received" : "made"} yet. Choose "Cheque" as the payment mode on Payment ${tab === "Received" ? "In" : "Out"}.`}
          onRetry={() => void reload()}
        />
        {!loading &&
          !error &&
          visible.map((c) => (
            <div key={c.id} className={cardClass} style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-black">{c.reference_no ? `Cheque #${c.reference_no}` : c.doc_no}</p>
                  <p className="truncate text-sm" style={{ color: AppColors.grey }}>
                    {c.party_name || "—"} · {formatDate(c.doc_date)}
                  </p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ backgroundColor: `${AppColors.primary}18`, color: AppColors.primary }}>
                  {c.status || "—"}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold text-black">{money(c.total_amount)}</p>
              {c.bank_account && <p className="text-xs" style={{ color: AppColors.grey }}>{c.bank_account}</p>}
            </div>
          ))}
      </div>
    </div>
  );
}
