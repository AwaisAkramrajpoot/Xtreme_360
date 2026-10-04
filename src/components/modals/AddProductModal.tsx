"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { AppColors } from "@/constants/colors";
import { CategorySelectField, UnitSelectField } from "@/components/modals/LookupSelectFields";
import { createItem, type ItemRecord } from "@/services/item-api";
import { getApiErrorMessage } from "@/utils/api-error";
import { useSettingsStore } from "@/stores/settings-store";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Receives the saved item, e.g. to pick it in the form that opened this modal. */
  onCreated?: (item: ItemRecord) => void;
}

export function AddProductModal({ open, onClose, onSuccess, onCreated }: AddProductModalProps) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loaded = useSettingsStore((s) => s.loaded);

  const [activeTab, setActiveTab] = useState<"pricing" | "stock">("pricing");
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
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
    taxPercent: "",
    discountRs: "",
    discountPercent: "",
    brand: "",
    serialNumber: "",
    modelNumber: "",
    warranty: "",
    manufacturingDate: "",
    expiryDate: "",
    batch: "",
    weight: "",
    color: "",
    size: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const generateBarcode = () =>
    Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");

  useEffect(() => {
    if (!loaded) loadSettings().catch(() => undefined);
  }, [loaded, loadSettings]);

  useEffect(() => {
    if (!open) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setItemImage(null);
    }
  }, [open, imagePreview]);

  const resetForm = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setForm({
      itemName: "",
      itemCode: itemSettings.barcodeScanning ? generateBarcode() : "",
      description: "",
      salePrice: "",
      purchasePrice: "",
      wholesalePrice: "",
      openingStock: "",
      asOfDate: "",
      atPrice: "",
      minStockQty: "",
      itemLocation: "",
      taxPercent: "",
      discountRs: "",
      discountPercent: "",
      brand: "",
      serialNumber: "",
      modelNumber: "",
      warranty: "",
      manufacturingDate: "",
      expiryDate: "",
      batch: "",
      weight: "",
      color: "",
      size: "",
    });
    setCategory(null);
    setUnit(null);
    setActiveTab("pricing");
    setItemImage(null);
    setImagePreview(null);
    setSubmitError(null);
  };

  useEffect(() => {
    if (open && itemSettings.barcodeScanning && !form.itemCode) {
      setForm((current) => ({
        ...current,
        itemCode: generateBarcode(),
      }));
    }
  }, [open, form.itemCode, itemSettings.barcodeScanning]);

  const handleImageChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setItemImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const ensureBarcode = () => {
    if (!itemSettings.barcodeScanning) return form.itemCode.trim() || undefined;
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
      const created = await createItem({
        itemName: form.itemName,
        itemType: "product",
        itemCode: ensureBarcode(),
        itemUnit: itemSettings.itemUnit ? unit : null,
        itemCategory: itemSettings.itemCategory ? category : null,
        description: itemSettings.description ? form.description : undefined,
        salePrice: form.salePrice,
        purchasePrice: form.purchasePrice,
        wholesalePrice: itemSettings.wholesalePrice ? form.wholesalePrice : undefined,
        openingStock: itemSettings.stockMaintenance ? form.openingStock : undefined,
        asOfDate: itemSettings.stockMaintenance ? form.asOfDate : undefined,
        atPrice: itemSettings.stockMaintenance ? form.atPrice : undefined,
        minStockQty: itemSettings.stockMaintenance ? form.minStockQty : undefined,
        itemLocation: itemSettings.stockMaintenance ? form.itemLocation : undefined,
        taxPercent: itemSettings.itemWiseTax ? form.taxPercent : undefined,
        discountRs: itemSettings.itemWiseDiscountRs ? form.discountRs : undefined,
        discountPercent: itemSettings.itemWiseDiscountPercent ? form.discountPercent : undefined,
        brand: itemSettings.brand ? form.brand : undefined,
        serialNumber: itemSettings.serialNumber ? form.serialNumber : undefined,
        modelNumber: itemSettings.modelNumber ? form.modelNumber : undefined,
        warranty: itemSettings.warranty ? form.warranty : undefined,
        manufacturingDate: itemSettings.manufacturingDate ? form.manufacturingDate : undefined,
        expiryDate: itemSettings.expiryDate ? form.expiryDate : undefined,
        batch: itemSettings.batch ? form.batch : undefined,
        weight: itemSettings.weight ? form.weight : undefined,
        color: itemSettings.color ? form.color : undefined,
        size: itemSettings.size ? form.size : undefined,
        itemImage,
      });
      resetForm();
      if (created?.id) onCreated?.(created);
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

  const showStockTab = itemSettings.stockMaintenance;

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

        {itemSettings.itemUnit && (
          <UnitSelectField title="Item Unit" hintText="Select Unit" value={unit} onChange={setUnit} />
        )}

        {itemSettings.barcodeScanning && (
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
        )}

        {itemSettings.itemCategory && (
          <CategorySelectField
            title="Item Category"
            hintText="Item Category"
            value={category}
            onChange={setCategory}
          />
        )}

        {itemSettings.description && (
          <AppTextField
            title="Description"
            hintText="Item description"
            value={form.description}
            onChange={set("description")}
            maxLines={3}
          />
        )}

        {itemSettings.brand && (
          <AppTextField title="Brand" hintText="Brand" value={form.brand} onChange={set("brand")} />
        )}
        {itemSettings.serialNumber && (
          <AppTextField
            title="Serial Number"
            hintText="Serial Number"
            value={form.serialNumber}
            onChange={set("serialNumber")}
          />
        )}
        {itemSettings.modelNumber && (
          <AppTextField
            title="Model Number"
            hintText="Model Number"
            value={form.modelNumber}
            onChange={set("modelNumber")}
          />
        )}
        {itemSettings.warranty && (
          <AppTextField
            title="Warranty"
            hintText="e.g. 1 Year"
            value={form.warranty}
            onChange={set("warranty")}
          />
        )}
        {itemSettings.manufacturingDate && (
          <AppTextField
            title="Manufacturing Date"
            hintText="dd/mm/yyyy"
            value={form.manufacturingDate}
            onChange={set("manufacturingDate")}
            isDateField
          />
        )}
        {itemSettings.expiryDate && (
          <AppTextField
            title="Expiry Date"
            hintText="dd/mm/yyyy"
            value={form.expiryDate}
            onChange={set("expiryDate")}
            isDateField
          />
        )}
        {itemSettings.batch && (
          <AppTextField title="Batch" hintText="Batch" value={form.batch} onChange={set("batch")} />
        )}
        {itemSettings.weight && (
          <AppTextField title="Weight" hintText="Weight" value={form.weight} onChange={set("weight")} />
        )}
        {itemSettings.color && (
          <AppTextField title="Color" hintText="Color" value={form.color} onChange={set("color")} />
        )}
        {itemSettings.size && (
          <AppTextField title="Size" hintText="Size" value={form.size} onChange={set("size")} />
        )}

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
          style={{ borderColor: AppColors.lightGrey, backgroundColor: "#F7F8FB" }}
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
            <span className="material-icons text-2xl" style={{ color: AppColors.grey }}>
              chevron_right
            </span>
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
          {showStockTab && chipBtn("Stock", "stock")}
        </div>

        {activeTab === "pricing" || !showStockTab ? (
          <div className="space-y-4 pt-2">
            <div
              className={clsx(
                "grid grid-cols-1 gap-4",
                itemSettings.wholesalePrice ? "sm:grid-cols-3" : "sm:grid-cols-2"
              )}
            >
              <AppTextField
                title="Purchase Price"
                hintText="Purchase Price"
                value={form.purchasePrice}
                onChange={set("purchasePrice")}
                type="number"
              />
              {itemSettings.wholesalePrice && (
                <AppTextField
                  title="Wholesale Price"
                  hintText="Wholesale Price"
                  value={form.wholesalePrice}
                  onChange={set("wholesalePrice")}
                  type="number"
                />
              )}
              <AppTextField
                title="Sale Price"
                hintText="Sale Price"
                value={form.salePrice}
                onChange={set("salePrice")}
                type="number"
              />
            </div>
            {itemSettings.itemWiseTax && (
              <AppTextField
                title="Tax %"
                hintText="0"
                value={form.taxPercent}
                onChange={set("taxPercent")}
                type="number"
              />
            )}
            {itemSettings.itemWiseDiscountRs && (
              <AppTextField
                title="Discount (Rs)"
                hintText="0"
                value={form.discountRs}
                onChange={set("discountRs")}
                type="number"
              />
            )}
            {itemSettings.itemWiseDiscountPercent && (
              <AppTextField
                title="Discount %"
                hintText="0"
                value={form.discountPercent}
                onChange={set("discountPercent")}
                type="number"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <AppTextField
              title="Opening Stock"
              hintText="Ex: 300"
              value={form.openingStock}
              onChange={set("openingStock")}
              type="number"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField
                title="As of Date"
                hintText="19/11/2025"
                value={form.asOfDate}
                onChange={set("asOfDate")}
                isDateField
              />
              <AppTextField
                title="At Price/Unit"
                hintText="Ex: 2,000"
                value={form.atPrice}
                onChange={set("atPrice")}
                type="number"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField
                title="Min Stock Qty"
                hintText="Ex: 5"
                value={form.minStockQty}
                onChange={set("minStockQty")}
                type="number"
              />
              <AppTextField
                title="Item Location"
                hintText="Item Location"
                value={form.itemLocation}
                onChange={set("itemLocation")}
              />
            </div>
          </div>
        )}
      </div>
    </AppModal>
  );
}
