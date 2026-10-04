"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { CategorySelectField, UnitSelectField } from "@/components/modals/LookupSelectFields";
import { createItem, type ItemCategoryRecord, type ItemRecord } from "@/services/item-api";
import type { UnitRecord } from "@/services/unit-api";
import { useItemLookupStore } from "@/stores/item-lookup-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";

interface SimpleNameModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title: string;
  fieldLabel: string;
  hintText: string;
  errorMessage?: string;
  onSubmit: (value: string) => Promise<void>;
}

function SimpleNameModal({
  open,
  onClose,
  onSuccess,
  title,
  fieldLabel,
  hintText,
  errorMessage = "This field is required",
  onSubmit,
}: SimpleNameModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      setError(errorMessage);
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      await onSubmit(value.trim());
      onSuccess?.();
      onClose();
      setValue("");
      setError("");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-3">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title={fieldLabel} hintText={hintText} value={value} onChange={setValue} error={error} />
      </div>
    </AppModal>
  );
}

export function AddCategoryModal({
  onCreated,
  ...props
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Receives the saved category, e.g. to select it in the form that opened this modal. */
  onCreated?: (category: ItemCategoryRecord) => void;
}) {
  const addCategory = useItemLookupStore((s) => s.addCategory);
  return (
    <SimpleNameModal
      {...props}
      title="Add Category"
      fieldLabel="Category Name"
      hintText="Enter Category Name"
      errorMessage="Please enter category name"
      onSubmit={async (name) => {
        const category = await addCategory(name);
        onCreated?.(category);
      }}
    />
  );
}

export function AddUnitModal({
  open,
  onClose,
  onSuccess,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Receives the saved unit, e.g. to select it in the form that opened this modal. */
  onCreated?: (unit: UnitRecord) => void;
}) {
  const addUnit = useItemLookupStore((s) => s.addUnit);
  const [shortName, setShortName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!unitName.trim()) {
      setError("Please enter unit name");
      return;
    }
    if (!shortName.trim()) {
      setError("Please enter short name");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const unit = await addUnit({ name: unitName, abbreviation: shortName });
      onCreated?.(unit);
      onSuccess?.();
      onClose();
      setUnitName("");
      setShortName("");
      setError("");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save unit"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Unit"
      size="sm"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Unit Name" hintText="Enter unit name" value={unitName} onChange={setUnitName} error={error} />
        <AppTextField title="Short Name" hintText="e.g. kg" value={shortName} onChange={setShortName} />
      </div>
    </AppModal>
  );
}

export function AddServiceModal({
  open,
  onClose,
  onSuccess,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Receives the saved service, e.g. to pick it in the form that opened this modal. */
  onCreated?: (item: ItemRecord) => void;
}) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loaded = useSettingsStore((s) => s.loaded);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) loadSettings().catch(() => undefined);
  }, [loaded, loadSettings]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const created = await createItem({
        itemName: name,
        itemType: "service",
        itemUnit: itemSettings.itemUnit ? unit : null,
        itemCategory: itemSettings.itemCategory ? category : null,
        purchasePrice,
        wholesalePrice: itemSettings.wholesalePrice ? wholesalePrice : undefined,
        salePrice: price,
      });
      if (created?.id) onCreated?.(created);
      onSuccess?.();
      onClose();
      setName("");
      setPrice("");
      setPurchasePrice("");
      setWholesalePrice("");
      setUnit(null);
      setCategory(null);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save service"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Service"
      size="lg"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Service Name" hintText="Enter service name" value={name} onChange={setName} />
        {itemSettings.itemUnit && (
          <UnitSelectField title="Service Unit" hintText="Select Unit" value={unit} onChange={setUnit} />
        )}
        {itemSettings.itemCategory && (
          <CategorySelectField
            title="Service Category"
            hintText="Service Category"
            value={category}
            onChange={setCategory}
          />
        )}
        {/* Services carry a cost (used when a service is a manufacturing cost line) but no stock. */}
        <div
          className={clsx(
            "grid grid-cols-1 gap-4",
            itemSettings.wholesalePrice ? "sm:grid-cols-3" : "sm:grid-cols-2"
          )}
        >
          <AppTextField
            title="Purchase Price"
            hintText="Cost"
            value={purchasePrice}
            onChange={setPurchasePrice}
            type="number"
          />
          {itemSettings.wholesalePrice && (
            <AppTextField
              title="Wholesale Price"
              hintText="0.00"
              value={wholesalePrice}
              onChange={setWholesalePrice}
              type="number"
            />
          )}
          <AppTextField title="Sale Price" hintText="0.00" value={price} onChange={setPrice} type="number" />
        </div>
      </div>
    </AppModal>
  );
}
