"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";

interface SimpleNameModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title: string;
  fieldLabel: string;
  hintText: string;
  errorMessage?: string;
}

function SimpleNameModal({
  open,
  onClose,
  onSuccess,
  title,
  fieldLabel,
  hintText,
  errorMessage = "This field is required",
}: SimpleNameModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) {
      setError(errorMessage);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    onSuccess?.();
    onClose();
    setValue("");
    setError("");
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} isLoading={loading} />}
    >
      <AppTextField title={fieldLabel} hintText={hintText} value={value} onChange={setValue} error={error} />
    </AppModal>
  );
}

export function AddCategoryModal(props: Omit<SimpleNameModalProps, "title" | "fieldLabel" | "hintText" | "errorMessage">) {
  return (
    <SimpleNameModal
      {...props}
      title="Add Category"
      fieldLabel="Category Name"
      hintText="Enter Category Name"
      errorMessage="Please enter category name"
    />
  );
}

export function AddUnitModal({ open, onClose, onSuccess }: Omit<SimpleNameModalProps, "title" | "fieldLabel" | "hintText">) {
  const [shortName, setShortName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!unitName.trim()) { setError("Please enter unit name"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    onSuccess?.();
    onClose();
    setUnitName("");
    setShortName("");
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
        <AppTextField title="Unit Name" hintText="Enter unit name" value={unitName} onChange={setUnitName} error={error} />
        <AppTextField title="Short Name" hintText="e.g. kg" value={shortName} onChange={setShortName} />
      </div>
    </AppModal>
  );
}

export function AddServiceModal(props: Omit<SimpleNameModalProps, "title" | "fieldLabel" | "hintText">) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    props.onSuccess?.();
    props.onClose();
  };

  return (
    <AppModal
      open={props.open}
      onClose={props.onClose}
      title="Add Service"
      size="md"
      footer={<FormButtonsRow onCancel={props.onClose} onSave={handleSave} isLoading={loading} />}
    >
      <div className="space-y-4">
        <AppTextField title="Service Name" hintText="Enter service name" value={name} onChange={setName} />
        <AppTextField title="Price" hintText="0.00" value={price} onChange={setPrice} type="number" />
      </div>
    </AppModal>
  );
}
