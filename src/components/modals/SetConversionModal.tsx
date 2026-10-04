"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { AppColors } from "@/constants/colors";
import { createUnitConversion, type UnitRecord } from "@/services/unit-api";
import { useItemLookupStore } from "@/stores/item-lookup-store";
import { getApiErrorMessage } from "@/utils/api-error";

const unitLabel = (u: UnitRecord) => (u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name);

/** "1 <base unit> = <qty> <secondary unit>", saved through POST /units/conversions. */
export function SetConversionModal({
  open,
  onClose,
  onSuccess,
  defaultBaseUnit,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultBaseUnit?: string;
}) {
  const units = useItemLookupStore((s) => s.units);
  const loadUnits = useItemLookupStore((s) => s.loadUnits);
  // Units are served from the shared store; hold the "add units first" hint until the first fetch lands.
  const [fetched, setFetched] = useState(false);
  const loading = !fetched;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadUnits()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loadUnits]);
  const [base, setBase] = useState<string | null>(defaultBaseUnit ?? null);
  const [secondary, setSecondary] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [errors, setErrors] = useState<{ base?: string; secondary?: string; qty?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const names = units.map((u) => u.name);
  const labelOf = (name: string) => {
    const unit = units.find((u) => u.name === name);
    return unit ? unitLabel(unit) : name;
  };

  const save = async () => {
    const next: typeof errors = {};
    const value = Number(qty);
    if (!base) next.base = "Select the base unit";
    if (!secondary) next.secondary = "Select the secondary unit";
    else if (secondary === base) next.secondary = "Choose a different unit";
    if (!(value > 0)) next.qty = "Enter a quantity greater than 0";
    setErrors(next);
    if (Object.keys(next).length || !base || !secondary) return;

    setSaving(true);
    setSubmitError("");
    try {
      await createUnitConversion({ baseUnit: base, secondaryUnit: secondary, baseUnitQty: 1, secondaryUnitQty: value });
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save conversion"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Set Conversion"
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} saveLabel="Save Conversion" isLoading={saving} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        {!loading && units.length < 2 ? (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }}>
            Add at least two units first (Items › Units › + Unit).
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <AppDropDown title="Base Unit *" items={names} value={base} onChange={setBase} hintText="e.g. Box" getLabel={labelOf} />
                {errors.base && <p className="mt-1 text-xs text-red-500">{errors.base}</p>}
              </div>
              <div>
                <AppDropDown title="Secondary Unit *" items={names} value={secondary} onChange={setSecondary} hintText="e.g. Pieces" getLabel={labelOf} />
                {errors.secondary && <p className="mt-1 text-xs text-red-500">{errors.secondary}</p>}
              </div>
            </div>
            <AppTextField
              title="Conversion Rate"
              required
              type="number"
              hintText="e.g. 12"
              value={qty}
              onChange={setQty}
              error={errors.qty}
            />
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: AppColors.bgColor2 }}>
              1 {base ? labelOf(base) : "base unit"} = <b>{Number(qty) > 0 ? qty : "?"}</b>{" "}
              {secondary ? labelOf(secondary) : "secondary unit"}
            </p>
          </>
        )}
      </div>
    </AppModal>
  );
}
