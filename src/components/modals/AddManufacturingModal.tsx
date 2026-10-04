"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { CategorySelectField, UnitSelectField } from "@/components/modals/LookupSelectFields";
import { NewItemModal } from "@/components/modals/NewItemModal";
import { AppColors } from "@/constants/colors";
import { getItems, type ItemRecord } from "@/services/item-api";
import { produceManufacturing } from "@/services/manufacturing-api";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";

type MaterialRow = { key: number; itemId: string | null; quantity: string };

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (value: number) => Math.round(value * 100) / 100;
const money = (value: number) =>
  `Rs ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const newRequestKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let rowSeq = 0;
const emptyRow = (): MaterialRow => ({ key: ++rowSeq, itemId: null, quantity: "" });

/**
 * Production run: pick materials (products consume stock, services are cost only), cost them
 * from their purchase price, and add the quantity made to a new or existing product.
 */
export function AddManufacturingModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loaded = useSettingsStore((s) => s.loaded);

  const [catalog, setCatalog] = useState<ItemRecord[]>([]);
  /** Material row whose picker opened "Add New Item"; the new item is filled into it. */
  const [newItemForRow, setNewItemForRow] = useState<number | null>(null);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [finishedId, setFinishedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [rows, setRows] = useState<MaterialRow[]>(() => [emptyRow()]);
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [updateItemCost, setUpdateItemCost] = useState(true);
  const [description, setDescription] = useState("");
  const [requestKey, setRequestKey] = useState(newRequestKey);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loaded) loadSettings().catch(() => undefined);
  }, [loaded, loadSettings]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getItems()
      .then((rows) => {
        if (!cancelled) setCatalog(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  const byId = useMemo(() => new Map(catalog.map((i) => [String(i.id), i])), [catalog]);
  const products = useMemo(() => catalog.filter((i) => (i.item_type || "product") === "product"), [catalog]);
  const materialOptions = useMemo(
    () => catalog.filter((i) => String(i.id) !== (mode === "existing" ? finishedId : null)).map((i) => String(i.id)),
    [catalog, mode, finishedId]
  );
  const isService = (item?: ItemRecord) => (item?.item_type || "product") === "service";
  const materialLabel = (id: string) => {
    const item = byId.get(id);
    if (!item) return id;
    return isService(item)
      ? `${item.item_name} · service`
      : `${item.item_name} · stock ${num(item.opening_stock)}${item.item_unit ? ` ${item.item_unit}` : ""}`;
  };

  // Stock needed per product across all rows (the same material can appear twice).
  const neededById = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const item = row.itemId ? byId.get(row.itemId) : undefined;
      if (!item || isService(item)) continue;
      map.set(row.itemId!, round2((map.get(row.itemId!) || 0) + num(row.quantity)));
    }
    return map;
  }, [rows, byId]);

  const lines = rows.map((row) => {
    const item = row.itemId ? byId.get(row.itemId) : undefined;
    const qty = num(row.quantity);
    const rate = num(item?.purchase_price);
    const short =
      item && !isService(item) ? (neededById.get(row.itemId!) || 0) > num(item.opening_stock) : false;
    return { row, item, qty, rate, amount: round2(qty * rate), short };
  });
  const totalCost = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const qtyMade = num(quantity);
  const unitCost = qtyMade > 0 ? round2(totalCost / qtyMade) : 0;
  const finishedItem = finishedId ? byId.get(finishedId) : undefined;

  const selectFinished = (id: string) => {
    setFinishedId(id);
    const item = byId.get(id);
    setWholesalePrice(item ? String(num(item.wholesale_price) || "") : "");
    setSalePrice(item ? String(num(item.sale_price) || "") : "");
    // A product can't be made from itself.
    setRows((current) => current.map((r) => (r.itemId === id ? { ...r, itemId: null } : r)));
  };

  const updateRow = (key: number, patch: Partial<MaterialRow>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const reset = () => {
    setMode("new");
    setFinishedId(null);
    setName("");
    setUnit(null);
    setCategory(null);
    setQuantity("1");
    setRows([emptyRow()]);
    setWholesalePrice("");
    setSalePrice("");
    setUpdateItemCost(true);
    setDescription("");
    setErrors({});
    setSubmitError(null);
    setRequestKey(newRequestKey());
  };

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (mode === "new" && !name.trim()) next.name = "Please enter the finished item name";
    if (mode === "existing" && !finishedId) next.finished = "Select the item you are manufacturing";
    if (!(qtyMade > 0)) next.quantity = "Enter a quantity greater than 0";
    const filled = lines.filter((l) => l.item);
    if (!filled.length) next.materials = "Add at least one material";
    else if (filled.some((l) => !(l.qty > 0))) next.materials = "Every material needs a quantity greater than 0";
    else if (filled.some((l) => l.short)) next.materials = "Some materials don't have enough stock";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setSubmitError(null);
    try {
      await produceManufacturing({
        requestKey,
        quantity: qtyMade,
        finishedItemId: mode === "existing" ? Number(finishedId) : null,
        name: mode === "new" ? name : undefined,
        itemUnit: mode === "new" && itemSettings.itemUnit ? unit : null,
        itemCategory: mode === "new" && itemSettings.itemCategory ? category : null,
        wholesalePrice: itemSettings.wholesalePrice ? wholesalePrice : undefined,
        salePrice,
        updateItemCost,
        description,
        materials: filled.map((l) => ({ itemId: l.item!.id, quantity: l.qty })),
      });
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      // Keep the request key: retrying the same form must not produce twice.
      setSubmitError(getApiErrorMessage(err, "Failed to save manufacturing"));
    } finally {
      setLoading(false);
    }
  };

  const chipBtn = (label: string, value: "new" | "existing") => (
    <button
      key={value}
      type="button"
      onClick={() => setMode(value)}
      className="flex-1 py-3 rounded-lg text-[15px] font-semibold border transition-colors"
      style={{
        backgroundColor: mode === value ? AppColors.primary : AppColors.white,
        color: mode === value ? AppColors.white : AppColors.primary,
        borderColor: AppColors.primary,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {label}
    </button>
  );

  const sectionTitle = (text: string) => (
    <p className="pt-2 text-[15px] font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
      {text}
    </p>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Manufacturing"
      size="xl"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void handleSave()} saveLabel="Save" isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        {sectionTitle("Finished Item")}
        <div className="flex gap-3">
          {chipBtn("New Item", "new")}
          {chipBtn("Existing Item", "existing")}
        </div>

        {mode === "new" ? (
          <>
            <AppTextField
              title="Item Name"
              hintText="Name of the product you are making"
              value={name}
              onChange={setName}
              error={errors.name}
            />
            {(itemSettings.itemUnit || itemSettings.itemCategory) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {itemSettings.itemUnit && (
                  <UnitSelectField title="Item Unit" hintText="Select Unit" value={unit} onChange={setUnit} />
                )}
                {itemSettings.itemCategory && (
                  <CategorySelectField
                    title="Item Category"
                    hintText="Item Category"
                    value={category}
                    onChange={setCategory}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <div>
            <AppDropDown
              title="Item"
              items={products.map((p) => String(p.id))}
              value={finishedId}
              onChange={selectFinished}
              hintText={products.length ? "Select product" : "No products yet"}
              getLabel={(id) => {
                const item = byId.get(id);
                return item ? `${item.item_name} · stock ${num(item.opening_stock)}` : id;
              }}
            />
            {errors.finished && <p className="mt-1 text-xs text-red-500">{errors.finished}</p>}
          </div>
        )}

        <AppTextField
          title="Quantity to Manufacture"
          hintText="e.g. 10"
          value={quantity}
          onChange={setQuantity}
          type="number"
          error={errors.quantity}
        />

        {sectionTitle("Materials Used")}
        <div className="space-y-3">
          {lines.map(({ row, item, rate, amount, short }, index) => (
            <div
              key={row.key}
              className="rounded-xl border p-3 sm:p-4"
              style={{ borderColor: short ? "#F5B5B5" : AppColors.lightGrey, backgroundColor: "#FAFBFC" }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                <AppDropDown
                  title={`Material ${index + 1}`}
                  items={materialOptions}
                  value={row.itemId}
                  onChange={(id) => updateRow(row.key, { itemId: id })}
                  hintText={catalog.length ? "Select item or service" : "No items yet"}
                  getLabel={materialLabel}
                  emptyText="No items yet"
                  actionLabel="Add New Item"
                  onAction={() => setNewItemForRow(row.key)}
                />
                <AppTextField
                  title="Quantity"
                  hintText="0"
                  value={row.quantity}
                  onChange={(v) => updateRow(row.key, { quantity: v })}
                  type="number"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => (current.length > 1 ? current.filter((r) => r.key !== row.key) : [emptyRow()]))
                  }
                  className="h-10 justify-self-end rounded-md px-3 text-sm font-semibold transition-colors hover:bg-red-50 sm:h-12 sm:justify-self-auto"
                  style={{ color: "#D14343" }}
                  aria-label={`Remove material ${index + 1}`}
                >
                  <span className="material-icons align-middle text-xl">delete_outline</span>
                </button>
              </div>
              {item && (
                <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs" style={{ color: AppColors.grey }}>
                  <span>
                    Cost {money(rate)}
                    {item.item_unit ? ` / ${item.item_unit}` : ""}
                    {isService(item) ? " · no stock used" : ` · in stock ${num(item.opening_stock)}`}
                  </span>
                  <span className="font-semibold text-black">{money(amount)}</span>
                </div>
              )}
              {short && item && (
                <p className="mt-1 text-xs text-red-500">
                  Not enough stock: need {neededById.get(row.itemId!)}, available {num(item.opening_stock)}
                </p>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((current) => [...current, emptyRow()])}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: AppColors.primary }}
          >
            <span className="material-icons text-lg">add_circle_outline</span>
            Add Material
          </button>
          {errors.materials && <p className="text-xs text-red-500">{errors.materials}</p>}
        </div>

        <div
          className="grid grid-cols-2 gap-3 rounded-xl p-4 text-sm"
          style={{ backgroundColor: `${AppColors.primary}10` }}
        >
          <span style={{ color: AppColors.greyishBlack }}>Total Manufacturing Cost</span>
          <span className="text-right font-bold text-black">{money(totalCost)}</span>
          <span style={{ color: AppColors.greyishBlack }}>Cost per Unit</span>
          <span className="text-right font-bold" style={{ color: AppColors.primary }}>
            {money(unitCost)}
          </span>
        </div>

        {sectionTitle("Pricing")}
        <div
          className={clsx(
            "grid grid-cols-1 gap-4",
            itemSettings.wholesalePrice ? "sm:grid-cols-3" : "sm:grid-cols-2"
          )}
        >
          <AppTextField title="Purchase Price" value={String(unitCost)} readOnly type="number" />
          {itemSettings.wholesalePrice && (
            <AppTextField
              title="Wholesale Price"
              hintText="Wholesale Price"
              value={wholesalePrice}
              onChange={setWholesalePrice}
              type="number"
            />
          )}
          <AppTextField title="Sale Price" hintText="Sale Price" value={salePrice} onChange={setSalePrice} type="number" />
        </div>
        <p className="text-xs" style={{ color: AppColors.grey }}>
          Purchase price is the cost per unit, worked out from each material&apos;s purchase price.
        </p>
        {mode === "existing" && finishedItem && (
          <label className="flex items-start gap-2 text-sm" style={{ color: AppColors.greyishBlack }}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              style={{ accentColor: AppColors.primary }}
              checked={updateItemCost}
              onChange={(e) => setUpdateItemCost(e.target.checked)}
            />
            <span>
              Update {finishedItem.item_name}&apos;s purchase price from {money(num(finishedItem.purchase_price))} to{" "}
              {money(unitCost)}
            </span>
          </label>
        )}

        <AppTextField
          title="Description"
          hintText="Notes about this batch"
          value={description}
          onChange={setDescription}
          maxLines={3}
        />
      </div>
      <NewItemModal
        open={newItemForRow !== null}
        onClose={() => setNewItemForRow(null)}
        onCreated={(item) => {
          setCatalog((current) => [item, ...current.filter((i) => i.id !== item.id)]);
          if (newItemForRow !== null) updateRow(newItemForRow, { itemId: String(item.id) });
        }}
      />
    </AppModal>
  );
}
