"use client";

import { useMemo, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppColors } from "@/constants/colors";
import { getApiErrorMessage } from "@/utils/api-error";
import { createParty, type PartyRecord } from "@/services/party-api";
import type { PosBill, PosPaymentLine } from "@/services/pos-api";
import { PAYMENT_MODES, buildKotHtml, buildReceiptHtml, printHtml } from "./pos-shared";
import { PosButton, PosField, posInput } from "./pos-ui";

const r2 = (n: number) => Number(n.toFixed(2));

/* ---------------- payment ---------------- */

export type PaymentResult = {
  payments: PosPaymentLine[];
  receivedAmount: number;
  /** Cash the customer handed over (for the change line on the receipt). */
  tendered: number;
  completed: boolean;
};

const MODE_ICON: Record<string, string> = { Cash: "payments", Card: "credit_card", Bank: "account_balance", Online: "qr_code_2", Cheque: "receipt" };

/** Quick cash buttons: exact, then the next round notes above the total. */
const quickCash = (total: number) => {
  const out = new Set<number>([r2(total)]);
  for (const step of [100, 500, 1000, 5000]) {
    const v = Math.ceil(total / step) * step;
    if (v > total) out.add(v);
  }
  return Array.from(out).slice(0, 5);
};

export function PaymentModal({
  total,
  money,
  hasCustomer,
  defaultCompleted,
  completedHint,
  busy,
  onClose,
  onConfirm,
}: {
  total: number;
  money: (v: number) => string;
  /** A named customer can leave a balance on account. */
  hasCustomer: boolean;
  defaultCompleted: boolean;
  completedHint: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (result: PaymentResult) => void;
}) {
  const [split, setSplit] = useState(false);
  const [mode, setMode] = useState<string>("Cash");
  const [cashGiven, setCashGiven] = useState<string>("");
  const [lines, setLines] = useState<PosPaymentLine[]>([{ mode: "Cash", amount: total }]);
  const [onAccount, setOnAccount] = useState(false);
  const [partial, setPartial] = useState<string>("");
  const [completed, setCompleted] = useState(defaultCompleted);
  const [error, setError] = useState("");

  const given = Number(cashGiven) || 0;
  const splitSum = r2(lines.reduce((s, l) => s + (Number(l.amount) || 0), 0));

  const summary = useMemo(() => {
    if (split) return { paid: Math.min(splitSum, total), change: 0 };
    if (onAccount) return { paid: Math.min(Number(partial) || 0, total), change: 0 };
    if (mode === "Cash") return { paid: total, change: cashGiven.trim() ? r2(given - total) : 0 };
    return { paid: total, change: 0 };
  }, [split, splitSum, total, onAccount, partial, mode, cashGiven, given]);
  const balance = r2(Math.max(total - summary.paid, 0));

  const confirm = () => {
    setError("");
    let payments: PosPaymentLine[];
    let tendered = 0;
    if (split) {
      if (splitSum - total > 0.009) return setError(`Split payments are ${money(r2(splitSum - total))} more than the total.`);
      if (total - splitSum > 0.009 && !hasCustomer) return setError("Select a customer to leave a balance, or collect the full amount.");
      payments = lines.filter((l) => Number(l.amount) > 0).map((l) => ({ mode: l.mode, amount: r2(Number(l.amount)) }));
    } else if (onAccount) {
      if (!hasCustomer) return setError("Select a customer before putting the bill on their account.");
      const amount = Math.min(Number(partial) || 0, total);
      payments = amount > 0 ? [{ mode, amount: r2(amount) }] : [];
    } else {
      if (mode === "Cash" && cashGiven.trim() && given + 0.009 < total) {
        return setError(`Cash received is ${money(r2(total - given))} short. Enter the full amount or use Split / On account.`);
      }
      payments = [{ mode, amount: r2(total) }];
      tendered = mode === "Cash" ? (cashGiven.trim() ? given : total) : 0;
    }
    onConfirm({ payments, receivedAmount: r2(payments.reduce((s, p) => s + p.amount, 0)), tendered, completed });
  };

  return (
    <AppModal
      open
      onClose={() => !busy && onClose()}
      title="Take Payment"
      titleIcon="point_of_sale"
      size="md"
      footer={
        <div className="grid grid-cols-3 gap-3">
          <PosButton onClick={onClose} disabled={busy}>Back</PosButton>
          <PosButton variant="primary" icon="check_circle" className="col-span-2 h-12 text-base" loading={busy} onClick={confirm}>
            {balance > 0 ? `Save · ${money(summary.paid)} paid` : `Complete · ${money(total)}`}
          </PosButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "#F1F8F1" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: AppColors.grey }}>Amount due</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: AppColors.primary }}>{money(total)}</p>
        </div>

        {!split && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PAYMENT_MODES.map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs font-semibold transition-colors"
                    style={{ borderColor: active ? AppColors.primary : AppColors.lightGrey, backgroundColor: active ? "#EAF2EA" : "#fff", color: active ? AppColors.primary : "#374151" }}
                  >
                    <span aria-hidden className="material-icons text-[22px]">{MODE_ICON[m] || "payments"}</span>
                    {m}
                  </button>
                );
              })}
            </div>

            {mode === "Cash" && !onAccount && (
              <div className="space-y-2">
                <PosField label="Cash received">
                  <input
                    type="number"
                    min={0}
                    autoFocus
                    inputMode="decimal"
                    value={cashGiven}
                    placeholder={String(total)}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className={`${posInput} h-12 text-lg font-bold`}
                    style={{ borderColor: AppColors.lightGrey }}
                  />
                </PosField>
                <div className="flex flex-wrap gap-2">
                  {quickCash(total).map((v) => (
                    <button key={v} type="button" onClick={() => setCashGiven(String(v))} className="h-9 rounded-lg border px-3 text-sm font-semibold tabular-nums hover:bg-gray-50" style={{ borderColor: AppColors.lightGrey }}>
                      {v === r2(total) ? "Exact" : money(v)}
                    </button>
                  ))}
                </div>
                {cashGiven.trim() && (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: summary.change < 0 ? "#FDECEC" : "#E8F5E9" }}>
                    <span className="text-sm font-semibold" style={{ color: summary.change < 0 ? AppColors.redText : "#2E7D32" }}>
                      {summary.change < 0 ? "Short by" : "Change to return"}
                    </span>
                    <span className="text-2xl font-extrabold tabular-nums" style={{ color: summary.change < 0 ? AppColors.redText : "#2E7D32" }}>
                      {money(Math.abs(summary.change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {hasCustomer && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={onAccount} onChange={(e) => setOnAccount(e.target.checked)} className="mt-1" style={{ accentColor: AppColors.primary }} />
                <span>
                  Pay later / part payment on the customer&apos;s account
                  {onAccount && (
                    <input
                      type="number"
                      min={0}
                      value={partial}
                      placeholder="Amount paid now (0 for none)"
                      onChange={(e) => setPartial(e.target.value)}
                      className={`${posInput} mt-2 h-10`}
                      style={{ borderColor: AppColors.lightGrey }}
                    />
                  )}
                </span>
              </label>
            )}
          </>
        )}

        {split && (
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <select value={l.mode} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, mode: e.target.value } : x)))} aria-label="Payment method" className={`${posInput} w-32 shrink-0`} style={{ borderColor: AppColors.lightGrey }}>
                  {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
                <input type="number" min={0} value={l.amount || ""} aria-label={`${l.mode} amount`} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: Math.max(0, Number(e.target.value) || 0) } : x)))} className={posInput} style={{ borderColor: AppColors.lightGrey }} />
                {lines.length > 1 && (
                  <button type="button" aria-label="Remove payment" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50">
                    <span aria-hidden className="material-icons">close</span>
                  </button>
                )}
              </div>
            ))}
            <PosButton variant="ghost" icon="add" onClick={() => setLines([...lines, { mode: PAYMENT_MODES.find((m) => !lines.some((l) => l.mode === m)) || "Card", amount: r2(Math.max(total - splitSum, 0)) }])}>
              Add method
            </PosButton>
            <p className="text-sm" style={{ color: Math.abs(splitSum - total) < 0.01 ? "#2E7D32" : AppColors.redText }}>
              Entered {money(splitSum)} of {money(total)}
            </p>
          </div>
        )}

        <button type="button" onClick={() => { setSplit(!split); setOnAccount(false); setError(""); }} className="text-sm font-semibold" style={{ color: AppColors.primary }}>
          {split ? "← Single payment method" : "Split between payment methods"}
        </button>

        {balance > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{money(balance)} stays due on the customer&apos;s account.</p>
        )}

        <label className="flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: AppColors.lightGrey }}>
          <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="mt-1" style={{ accentColor: AppColors.primary }} />
          <span>
            <span className="font-semibold text-black">Order completed</span>
            <span className="block text-xs" style={{ color: AppColors.grey }}>{completedHint}</span>
          </span>
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </AppModal>
  );
}

/* ---------------- receipt ---------------- */

export function ReceiptModal({ bill, tendered, onClose, onNewOrder }: { bill: PosBill; tendered: number; onClose: () => void; onNewOrder: () => void }) {
  const html = useMemo(() => buildReceiptHtml(bill, { tendered }), [bill, tendered]);
  const [blocked, setBlocked] = useState(false);
  return (
    <AppModal
      open
      onClose={onClose}
      title={`Payment received · ${bill.doc_no || ""}`}
      titleIcon="check_circle"
      size="md"
      footer={
        <div className="grid grid-cols-3 gap-2">
          <PosButton icon="print" variant="warning" onClick={() => setBlocked(!printHtml(html))}>Receipt</PosButton>
          <PosButton icon="soup_kitchen" onClick={() => setBlocked(!printHtml(buildKotHtml(bill)))}>KOT</PosButton>
          <PosButton icon="add" variant="primary" onClick={onNewOrder}>New order</PosButton>
        </div>
      }
    >
      {blocked && <p className="mb-2 text-sm text-red-600">Your browser blocked printing. Allow pop-ups and try again.</p>}
      <div className="flex justify-center rounded-xl bg-[#F4F4F4] p-3">
        <iframe title="Receipt preview" srcDoc={html} className="h-[60vh] w-[320px] rounded-lg bg-white shadow" />
      </div>
    </AppModal>
  );
}

/* ---------------- quick customer ---------------- */

export function NewCustomerModal({ onClose, onCreated, initialName = "" }: { onClose: () => void; onCreated: (party: PartyRecord) => void; initialName?: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter the customer's name";
    if (phone.trim() && !/^[+\d][\d\s-]{6,}$/.test(phone.trim())) next.phone = "Enter a valid phone number";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setSubmitError("");
    try {
      const party = await createParty({
        partyName: name.trim(),
        partyType: "Customer",
        mobileNumber: phone.trim() || undefined,
        address: address.trim() || undefined,
        shippingAddress: address.trim() || undefined,
        isActive: true,
      });
      if (party) onCreated(party);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to add customer"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title="New Customer"
      titleIcon="person_add"
      size="sm"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <PosButton onClick={onClose}>Cancel</PosButton>
          <PosButton variant="primary" icon="check" loading={saving} onClick={() => void save()}>Add customer</PosButton>
        </div>
      }
    >
      <div className="space-y-3">
        {submitError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <PosField label="Name" required error={errors.name}>
          <input autoFocus className={posInput} style={{ borderColor: AppColors.lightGrey }} value={name} onChange={(e) => setName(e.target.value)} />
        </PosField>
        <PosField label="Phone" error={errors.phone}>
          <input type="tel" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" />
        </PosField>
        <PosField label="Address">
          <textarea rows={2} className={`${posInput} h-auto py-2`} style={{ borderColor: AppColors.lightGrey }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Used for deliveries" />
        </PosField>
      </div>
    </AppModal>
  );
}
