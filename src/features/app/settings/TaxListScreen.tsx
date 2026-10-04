"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppColors } from "@/constants/colors";
import type { TaxRate } from "@/constants/app-settings";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";
import { SettingsLayout, SettingsSection, SettingsSegmented, useSettingsScreen } from "./SettingsUi";

const TABS = ["Tax Rates", "Tax Groups"] as const;
const TAX_NAMES = ["GST", "VAT", "Sales Tax", "Other"] as const;

function AddTaxRateModal({ onClose }: { onClose: () => void }) {
  const rates = useSettingsStore((s) => s.app.taxes.rates);
  const patchSection = useSettingsStore((s) => s.patchSection);
  const { notify } = useSettingsScreen();
  const [name, setName] = useState<string>(TAX_NAMES[0]);
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const trimmedName = name.trim();
    const value = Number(rate);
    if (!trimmedName) return setError("Enter a tax name.");
    if (rate.trim() === "" || !Number.isFinite(value) || value < 0 || value > 100) {
      return setError("Rate must be a number between 0 and 100.");
    }
    if (rates.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase() && r.rate === value)) {
      return setError("This tax rate already exists.");
    }

    const next: TaxRate = { id: `${Date.now()}`, name: trimmedName, rate: value };
    setSaving(true);
    setError("");
    try {
      await patchSection("taxes", { rates: [next, ...rates] });
      notify("Tax rate added");
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save tax rate"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#588157]";

  return (
    <AppModal
      open
      onClose={onClose}
      title="Add Tax Rate"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg font-semibold"
            style={{ backgroundColor: AppColors.lightGrey }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-11 flex-1 rounded-lg font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: AppColors.primary }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-sm font-semibold text-black">
          <span>Tax name</span>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
          >
            {TAX_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-semibold text-black">
          <span>Rate (%)</span>
          <input
            value={rate}
            inputMode="decimal"
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 17"
            className={inputClass}
            style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
          />
        </label>
      </div>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </AppModal>
  );
}

function TaxRatesContent({ tab }: { tab: (typeof TABS)[number] }) {
  const rates = useSettingsStore((s) => s.app.taxes.rates);
  const patchSection = useSettingsStore((s) => s.patchSection);
  const { notify, query } = useSettingsScreen();
  const { confirm } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (rate: TaxRate) => {
    const ok = await confirm({
      title: "Delete tax rate",
      message: `Delete ${rate.name} ${rate.rate}%?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(rate.id);
    try {
      await patchSection("taxes", { rates: rates.filter((r) => r.id !== rate.id) });
      notify("Tax rate deleted");
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to delete tax rate"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (tab === "Tax Groups") {
    return (
      <SettingsSection title="Tax Groups" icon="category">
        <p data-settings-row className="px-4 py-8 text-center text-sm" style={{ color: AppColors.grey }}>
          No tax groups yet.
        </p>
      </SettingsSection>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = q ? rates.filter((r) => `${r.name} ${r.rate}%`.toLowerCase().includes(q)) : rates;

  return (
    <>
      <SettingsSection title="Tax Rates" icon="percent" description="Saved to your account">
        {visible.map((rate) => (
          <div key={rate.id} data-settings-row className="flex min-h-14 items-center gap-4 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-black">{rate.name}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: AppColors.primary }}>
              {rate.rate}%
            </span>
            <button
              type="button"
              aria-label={`Delete ${rate.name} ${rate.rate}%`}
              disabled={deletingId === rate.id}
              onClick={() => void remove(rate)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <span className="material-icons" style={{ fontSize: 20 }}>delete_outline</span>
            </button>
          </div>
        ))}
        {!rates.length && (
          <p className="px-4 py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            No tax rates yet. Tap + to add one.
          </p>
        )}
      </SettingsSection>

      <button
        type="button"
        aria-label="Add tax rate"
        onClick={() => setAdding(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg md:bottom-8"
        style={{ backgroundColor: AppColors.primary }}
      >
        <span className="material-icons text-white">add</span>
      </button>

      {adding && <AddTaxRateModal onClose={() => setAdding(false)} />}
    </>
  );
}

export function TaxListScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tax Rates");
  return (
    <SettingsLayout
      title="Tax List"
      toolbar={<SettingsSegmented label="Tax list" options={TABS} value={tab} onChange={setTab} />}
    >
      <TaxRatesContent tab={tab} />
    </SettingsLayout>
  );
}
