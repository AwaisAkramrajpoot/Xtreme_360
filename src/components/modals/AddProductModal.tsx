"use client";

import { useState } from "react";
import clsx from "clsx";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { AppColors } from "@/constants/colors";

const CATEGORIES = ["Mix", "Switch", "Electronics"] as const;

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddProductModal({ open, onClose, onSuccess }: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<"pricing" | "stock">("pricing");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    itemCode: "",
    description: "",
    salePrice: "",
    purchasePrice: "",
    wholesalePrice: "",
    openingStock: "",
    asOfDate: "",
    atPrice: "",
    minStockQty: "",
    itemLocation: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.itemName.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  const chipBtn = (label: string, tab: "pricing" | "stock") => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={clsx("flex-1 py-3 rounded-lg text-[15px] font-semibold border transition-colors")}
      style={{
        backgroundColor: activeTab === tab ? AppColors.primary : AppColors.white,
        color: activeTab === tab ? AppColors.white : AppColors.primary,
        borderColor: AppColors.primary,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {label}
    </button>
  );

  const sideChip = (text: string) => (
    <div
      className="mt-6 px-3 py-2.5 rounded-lg text-[13px] whitespace-nowrap shrink-0"
      style={{ backgroundColor: AppColors.lightGrey, color: AppColors.greyishBlack }}
    >
      {text}
    </div>
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add New Item"
      size="xl"
      footer={
        <FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />
      }
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <AppTextField title="Item Name" hintText="Add Item Name" value={form.itemName} onChange={set("itemName")} />
          </div>
          {sideChip("Select Unit")}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <AppTextField title="Item Code / Barcode" hintText="Item Code/Barcode" value={form.itemCode} onChange={set("itemCode")} />
          </div>
          {sideChip("Assign Code")}
        </div>
        <AppDropDown
          title="Item Category"
          items={[...CATEGORIES]}
          value={category}
          onChange={setCategory}
          hintText="Item Category"
        />
        <AppTextField title="Description" hintText="Item description" value={form.description} onChange={set("description")} maxLines={3} />

        <div className="flex gap-3 pt-2">
          {chipBtn("Pricing", "pricing")}
          {chipBtn("Stock", "stock")}
        </div>

        {activeTab === "pricing" ? (
          <div className="space-y-4 pt-2">
            <AppTextField title="Sale Price" hintText="Sale Price" value={form.salePrice} onChange={set("salePrice")} type="number" />
            <AppTextField title="Purchase Price" hintText="Purchase Price" value={form.purchasePrice} onChange={set("purchasePrice")} type="number" />
            <AppTextField title="Wholesale Price" hintText="Wholesale Price" value={form.wholesalePrice} onChange={set("wholesalePrice")} type="number" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <AppTextField title="Opening Stock" hintText="Ex: 300" value={form.openingStock} onChange={set("openingStock")} type="number" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppTextField title="As of Date" hintText="19/11/2025" value={form.asOfDate} onChange={set("asOfDate")} isDateField />
              <AppTextField title="At Price/Unit" hintText="Ex: 2,000" value={form.atPrice} onChange={set("atPrice")} type="number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppTextField title="Min Stock Qty" hintText="Ex: 5" value={form.minStockQty} onChange={set("minStockQty")} type="number" />
              <AppTextField title="Item Location" hintText="Item Location" value={form.itemLocation} onChange={set("itemLocation")} />
            </div>
          </div>
        )}
      </div>
    </AppModal>
  );
}
