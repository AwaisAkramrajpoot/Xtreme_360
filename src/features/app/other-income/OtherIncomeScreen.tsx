"use client";

import { useCallback, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { IconButton } from "@/components/ui/IconButton";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { formatMoney } from "@/constants/app-settings";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { getAccounts } from "@/services/cash-bank-api";
import {
  createOtherIncome,
  deleteOtherIncome,
  getNextOtherIncomeNo,
  getOtherIncomes,
  updateOtherIncome,
  type OtherIncome,
} from "@/services/other-income-api";
import { getApiErrorMessage } from "@/utils/api-error";

const PAYMENT_MODES = ["Cash", "Bank", "Cheque", "Online"];
const SUGGESTED_CATEGORIES = ["Rental Income", "Commission", "Interest Income", "Scrap Sale", "Other"];

const today = () => new Date().toLocaleDateString("en-CA");

function formatDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

type FormErrors = Partial<Record<"category" | "amount" | "date" | "bankAccount", string>>;

function IncomeModal({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: OtherIncome | null;
  categories: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const nextNo = useAsyncData(useCallback(() => (initial ? Promise.resolve(initial.income_no) : getNextOtherIncomeNo()), [initial]), "");
  const accounts = useAsyncData(useCallback(() => getAccounts("bank"), []), []);
  const [date, setDate] = useState(initial?.income_date ?? today());
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [mode, setMode] = useState(initial?.payment_mode ?? "Cash");
  const [bankAccount, setBankAccount] = useState(initial?.bank_account ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryOptions = Array.from(new Set([...categories, ...SUGGESTED_CATEGORIES]));

  const save = async () => {
    const next: FormErrors = {};
    const value = Number(amount);
    if (!category.trim()) next.category = "Category is required";
    if (!(value > 0)) next.amount = "Enter an amount greater than 0";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = "Choose a date";
    if (mode !== "Cash" && accounts.data.length && !bankAccount) next.bankAccount = "Select the account it was received in";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSubmitError("");
    const payload = { incomeDate: date, category, amount: value, paymentMode: mode, bankAccount: mode === "Cash" ? "" : bankAccount, notes };
    try {
      if (initial) await updateOtherIncome(initial.id, payload);
      else await createOtherIncome(payload);
      onSaved(initial ? "Income updated" : "Income saved");
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save income"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={initial ? "Edit Other Income" : "Add Other Income"}
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} isLoading={saving} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Income No." value={nextNo.loading ? "…" : nextNo.data} onChange={() => undefined} readOnly />
          <AppTextField title="Date" required hintText="yyyy-mm-dd" value={date} onChange={setDate} isDateField error={errors.date} />
        </div>
        <div>
          <AppTextField
            title="Category"
            required
            hintText="e.g. Rental Income"
            value={category}
            onChange={setCategory}
            error={errors.category}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                style={{
                  borderColor: category === c ? AppColors.primary : AppColors.lightGrey,
                  color: category === c ? AppColors.primary : AppColors.greyishBlack,
                  backgroundColor: category === c ? "#EAF2EA" : "white",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Amount" required type="number" hintText="0.00" value={amount} onChange={setAmount} error={errors.amount} />
          <AppDropDown title="Received In" items={PAYMENT_MODES} value={mode} onChange={setMode} />
        </div>
        {mode !== "Cash" &&
          (accounts.data.length ? (
            <div>
              <AppDropDown
                title="Bank Account *"
                items={accounts.data.map((a) => a.account_name)}
                value={bankAccount || null}
                onChange={setBankAccount}
                hintText="Select bank account"
              />
              {errors.bankAccount && <p className="mt-1 text-xs text-red-500">{errors.bankAccount}</p>}
            </div>
          ) : (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }}>
              No bank accounts yet — add one in Cash &amp; Bank to track where this was received.
            </p>
          ))}
        <AppTextField title="Notes" hintText="Optional" value={notes} onChange={setNotes} maxLines={2} />
      </div>
    </AppModal>
  );
}

export function OtherIncomeScreen({ openAdd = false }: { openAdd?: boolean } = {}) {
  const general = useSettingsStore((s) => s.app.general);
  const money = (v: number | string) => formatMoney(v, general);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getOtherIncomes, [] as OtherIncome[], "Failed to load other income");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; income: OtherIncome | null }>({ open: openAdd, income: null });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((i) => [i.income_no, i.category, i.notes, i.payment_mode].some((v) => v && v.toLowerCase().includes(q)));
  }, [data, search]);

  const total = filtered.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const categories = useMemo(() => Array.from(new Set(data.map((i) => i.category))), [data]);

  const remove = async (income: OtherIncome) => {
    const ok = await confirm({ title: "Delete income", message: `Delete ${income.income_no}?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteOtherIncome(income.id);
      showToast("Income deleted");
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete income"), "error");
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Other Income" showBack showSearch searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search income" />

      {!loading && !error && data.length > 0 && (
        <div className="mb-4 rounded-2xl p-5 text-white" style={{ backgroundColor: AppColors.primary }}>
          <p className="text-sm opacity-90">{search.trim() ? "Total (filtered)" : "Total other income"}</p>
          <p className="mt-1 text-2xl font-bold">{money(total)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 pb-20 md:grid-cols-2 md:pb-4">
        {loading && [0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />)}
        {error && (
          <div className="col-span-full flex flex-col items-center gap-3 py-10 text-sm text-red-500">
            <p>{error}</p>
            <button type="button" onClick={reload} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ backgroundColor: AppColors.primary }}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !filtered.length && (
          <p className="col-span-full py-10 text-center text-sm" style={{ color: AppColors.grey }}>
            {data.length ? "No income matches your search." : "No other income yet. Tap + to record income like rent, commission or interest."}
          </p>
        )}
        {!loading &&
          !error &&
          filtered.map((income) => (
            <div key={income.id} className="rounded-2xl border bg-white p-4 lg:p-5" style={{ borderColor: AppColors.lightGrey }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-black">{income.category}</p>
                  <p className="truncate text-sm" style={{ color: AppColors.grey }}>
                    {income.income_no} · {formatDate(income.income_date)} · {income.payment_mode}
                    {income.bank_account ? ` (${income.bank_account})` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon="edit" label="Edit" variant="edit" onClick={() => setModal({ open: true, income })} />
                  <IconButton icon="delete" label="Delete" variant="delete" onClick={() => void remove(income)} />
                </div>
              </div>
              <p className="mt-3 text-lg font-semibold" style={{ color: AppColors.greenText }}>
                {money(income.amount)}
              </p>
              {income.notes && <p className="mt-1 text-sm text-black/70">{income.notes}</p>}
            </div>
          ))}
      </div>

      <FloatingActionButton onClick={() => setModal({ open: true, income: null })} />
      {modal.open && (
        <IncomeModal
          initial={modal.income}
          categories={categories}
          onClose={() => setModal({ open: false, income: null })}
          onSaved={(message) => {
            showToast(message);
            reload();
          }}
        />
      )}
      {Toast}
    </div>
  );
}
