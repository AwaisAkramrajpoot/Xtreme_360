"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { AppColors } from "@/constants/colors";
import { createItem, getItemCategories } from "@/services/item-api";
import { getUnits } from "@/services/unit-api";
import { getApiErrorMessage } from "@/utils/api-error";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddProductModal({ open, onClose, onSuccess }: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<"pricing" | "stock">("pricing");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const generateBarcode = () =>
    Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      try {
        const [categoryRows, unitRows] = await Promise.all([getItemCategories(), getUnits()]);
        if (cancelled) return;
        setCategories(categoryRows.map((c) => c.name).filter(Boolean));
        setUnits(unitRows.map((u) => u.name || u.abbreviation).filter(Boolean));
      } catch {
        // Keep modal usable even if lookups fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setItemImage(null);
    }
  }, [open, imagePreview]);

  const resetForm = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setForm({
      itemName: "",
      itemCode: generateBarcode(),
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
    setCategory(null);
    setUnit(null);
    setActiveTab("pricing");
    setItemImage(null);
    setImagePreview(null);
    setSubmitError(null);
  };

  useEffect(() => {
    if (open && !form.itemCode) {
      setForm((current) => ({
        ...current,
        itemCode: generateBarcode(),
      }));
    }
  }, [open, form.itemCode]);

  const handleImageChange = (file: File | null) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setItemImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const ensureBarcode = () => {
    const existing = form.itemCode.trim();
    return existing.length === 16 && /^\d{16}$/.test(existing) ? existing : generateBarcode();
  };

  const handleSave = async () => {
    if (!form.itemName.trim()) {
      setSubmitError("Please enter item name");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      await createItem({
        itemName: form.itemName,
        itemType: "product",
        itemCode: ensureBarcode(),
        itemUnit: unit && unit !== "No units yet" ? unit : null,
        itemCategory: category && category !== "No categories yet" ? category : null,
        description: form.description,
        salePrice: form.salePrice,
        purchasePrice: form.purchasePrice,
        wholesalePrice: form.wholesalePrice,
        openingStock: form.openingStock,
        asOfDate: form.asOfDate,
        atPrice: form.atPrice,
        minStockQty: form.minStockQty,
        itemLocation: form.itemLocation,
        itemImage,
      });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Failed to save product"));
    } finally {
      setLoading(false);
    }
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

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add New Item"
      size="xl"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Item Name" hintText="Add Item Name" value={form.itemName} onChange={set("itemName")} />
        <AppDropDown
          title="Item Unit"
          items={units.length ? units : ["No units yet"]}
          value={unit}
          onChange={setUnit}
          hintText="Select Unit"
        />
        <AppTextField
          title="Item Code / Barcode"
          hintText="Auto-generated if empty"
          value={form.itemCode}
          onChange={set("itemCode")}
          maxLength={16}
          suffix={
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, itemCode: generateBarcode() }))}
              className="text-xs font-semibold"
              style={{ color: AppColors.primary }}
            >
              Auto
            </button>
          }
        />
        <AppDropDown
          title="Item Category"
          items={categories.length ? categories : ["No categories yet"]}
          value={category}
          onChange={setCategory}
          hintText="Item Category"
        />
        <AppTextField title="Description" hintText="Item description" value={form.description} onChange={set("description")} maxLines={3} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full overflow-hidden rounded-2xl border text-left transition-transform hover:-translate-y-0.5"
          style={{
            borderColor: AppColors.lightGrey,
            backgroundColor: "#F7F8FB",
          }}
        >
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${AppColors.primary}14` }}
            >
              <span className="material-icons text-2xl" style={{ color: AppColors.primary }}>
                photo_library
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black">Choose product image</p>
              <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                Tap to upload a picture for this product
              </p>
              <p className="mt-2 truncate text-xs font-medium" style={{ color: AppColors.greyishBlack }}>
                {itemImage ? itemImage.name : "No image selected"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {itemImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageChange(null);
                  }}
                  className="rounded-full border px-3 py-2 text-xs font-semibold"
                  style={{ borderColor: AppColors.lightGrey, color: AppColors.greyishBlack, backgroundColor: AppColors.white }}
                >
                  Clear
                </button>
              )}
              <span className="material-icons text-2xl" style={{ color: AppColors.grey }}>
                chevron_right
              </span>
            </div>
          </div>
        </button>
        {imagePreview && (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: AppColors.lightGrey, backgroundColor: "#F7F8FB" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Product preview" className="h-56 w-full object-cover" />
          </div>
        )}

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
