"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { createItem, createItemCategory } from "@/services/item-api";
import { createManufacturing } from "@/services/manufacturing-api";
import { createUnit } from "@/services/unit-api";
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

export function AddCategoryModal(props: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  return (
    <SimpleNameModal
      {...props}
      title="Add Category"
      fieldLabel="Category Name"
      hintText="Enter Category Name"
      errorMessage="Please enter category name"
      onSubmit={async (name) => {
        await createItemCategory(name);
      }}
    />
  );
}

export function AddUnitModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
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
      await createUnit({ name: unitName, abbreviation: shortName });
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
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await createItem({
        itemName: name,
        itemType: "service",
        salePrice: price,
      });
      onSuccess?.();
      onClose();
      setName("");
      setPrice("");
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
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField title="Service Name" hintText="Enter service name" value={name} onChange={setName} />
        <AppTextField title="Price" hintText="0.00" value={price} onChange={setPrice} type="number" />
      </div>
    </AppModal>
  );
}

export function AddManufacturingModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    salePrice: "",
    wholesalePrice: "",
    description: "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Please enter manufacturing name");
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      await createManufacturing({
        name: form.name,
        salePrice: form.salePrice,
        wholesalePrice: form.wholesalePrice,
        description: form.description,
      });
      onSuccess?.();
      onClose();
      setForm({ name: "", salePrice: "", wholesalePrice: "", description: "" });
      setError("");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to save manufacturing"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
  }, [open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Manufacturing"
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} saveLabel="Save" isLoading={loading} />}
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppTextField
          title="Manufacturing Name"
          hintText="Enter name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          error={error}
        />
        <AppTextField
          title="Sale Price"
          hintText="0.00"
          value={form.salePrice}
          onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))}
          type="number"
        />
        <AppTextField
          title="Wholesale Price"
          hintText="0.00"
          value={form.wholesalePrice}
          onChange={(v) => setForm((f) => ({ ...f, wholesalePrice: v }))}
          type="number"
        />
        <AppTextField
          title="Description"
          hintText="Enter description"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          maxLines={3}
        />
      </div>
    </AppModal>
  );
}
