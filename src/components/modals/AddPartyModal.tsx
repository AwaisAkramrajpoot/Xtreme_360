"use client";

import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { AppColors } from "@/constants/colors";
import { createParty, updateParty, type PartyRecord } from "@/services/party-api";
import { getApiErrorMessage } from "@/utils/api-error";
import { useSettingsStore } from "@/stores/settings-store";

const PARTY_TYPES = ["Supplier", "Customer", "Both"] as const;
const PARTY_CATEGORIES = ["Category 1", "Category 2", "Category 3"] as const;
const PARTY_CATEGORY_STORAGE_KEY = "party_categories";
const COUNTRIES = ["Pakistan", "India", "Bangladesh", "United Arab Emirates", "USA"] as const;
const CITIES = ["Karachi", "Lahore", "Islamabad"] as const;
const AREAS = ["Area 1", "Area 2", "Area 3"] as const;
const ZONES = ["Zone 1", "Zone 2", "Zone 3"] as const;

interface AddPartyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: PartyRecord | null;
}

function ImageUploadBox({
  label,
  file,
  onSelect,
}: {
  label: string;
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm"
      style={{ borderColor: "#D0CFCF" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      <span className="material-icons mb-2 text-3xl" style={{ color: "#8C8CA1" }}>
        upload
      </span>
      <p className="font-semibold text-black">{label}</p>
      <p className="mt-1 text-xs" style={{ color: "#8C8CA1" }}>
        {file ? file.name : "Click to upload"}
      </p>
    </button>
  );
}

const emptyForm = {
  openingDate: "",
  partyName: "",
  openingBalance: "",
  mobileNumber: "",
  cncNumber: "",
  address: "",
  emergencyNumber: "",
  tinNumber: "",
  shippingAddress: "",
};

export function AddPartyModal({ open, onClose, onSuccess, initialData = null }: AddPartyModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [partyType, setPartyType] = useState<string | null>(null);
  const [partyCategory, setPartyCategory] = useState<string | null>(null);
  const [partyCategories, setPartyCategories] = useState<string[]>([...PARTY_CATEGORIES]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [cncFrontPicture, setCncFrontPicture] = useState<File | null>(null);
  const [cncBackPicture, setCncBackPicture] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const partySettings = useSettingsStore((s) => s.app.party);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const mergeCategories = (values: string[]) => {
    const normalized = values.map((value) => value.trim()).filter(Boolean);
    const merged = [...PARTY_CATEGORIES, ...normalized];
    return Array.from(new Set(merged));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setIsActive(true);
    setPartyType(null);
    setPartyCategory(null);
    setAddingCategory(false);
    setNewCategoryName("");
    setAddCategoryLoading(false);
    setAddCategoryError("");
    setCountry(null);
    setCity(null);
    setArea(null);
    setZone(null);
    setCncFrontPicture(null);
    setCncBackPicture(null);
    setErrors({});
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open) return;
    const storedCategories = window.localStorage.getItem(PARTY_CATEGORY_STORAGE_KEY);
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed)) {
          setPartyCategories(mergeCategories(parsed.filter((item): item is string => typeof item === "string")));
        }
      } catch {
        // Keep fallback categories if stored value is invalid.
      }
    }
    if (initialData) {
      const nextCategories = mergeCategories(initialData.party_category ? [initialData.party_category] : []);
      setPartyCategories((current) => Array.from(new Set([...current, ...nextCategories])));
      setForm({
        openingDate: initialData.opening_date || "",
        partyName: initialData.party_name || "",
        openingBalance: initialData.opening_balance || "",
        mobileNumber: initialData.mobile_number || "",
        cncNumber: initialData.cnc_number || "",
        address: initialData.address || "",
        emergencyNumber: initialData.emergency_number || "",
        tinNumber: initialData.tin_number || "",
        shippingAddress: initialData.shipping_address || "",
      });
      setIsActive(initialData.is_active !== false);
      setPartyType(initialData.party_type || null);
      setPartyCategory(initialData.party_category || null);
      setCountry(initialData.country || null);
      setCity(initialData.city || null);
      setArea(initialData.area || null);
      setZone(initialData.zone || null);
      setCncFrontPicture(null);
      setCncBackPicture(null);
      setErrors({});
      setSubmitError(null);
      return;
    }
    resetForm();
  }, [open, initialData]);

  const persistCategories = (values: string[]) => {
    const next = mergeCategories(values);
    setPartyCategories(next);
    window.localStorage.setItem(PARTY_CATEGORY_STORAGE_KEY, JSON.stringify(next));
  };

  const handleAddCategory = async () => {
    const nextCategory = newCategoryName.trim();
    if (!nextCategory) {
      setAddCategoryError("Enter a category name");
      return;
    }

    setAddCategoryLoading(true);
    setAddCategoryError("");
    try {
      const next = Array.from(new Set([...partyCategories, nextCategory]));
      persistCategories(next);
      setPartyCategory(nextCategory);
      setNewCategoryName("");
      setAddingCategory(false);
    } catch (error) {
      setAddCategoryError(getApiErrorMessage(error, "Failed to add category"));
    } finally {
      setAddCategoryLoading(false);
    }
  };

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (!form.partyName.trim()) next.partyName = "Please enter party name";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      partyName: form.partyName,
      openingDate: form.openingDate,
      isActive,
      partyType,
      // Hidden fields are not sent, so existing values on the party are kept.
      partyCategory: partySettings.partyGrouping ? partyCategory : undefined,
      openingBalance: form.openingBalance,
      mobileNumber: form.mobileNumber,
      country,
      city,
      area,
      zone,
      cncNumber: form.cncNumber,
      address: form.address,
      emergencyNumber: form.emergencyNumber,
      tinNumber: partySettings.tinNumber ? form.tinNumber : undefined,
      shippingAddress: partySettings.partyShippingAddress ? form.shippingAddress : undefined,
      cncFrontPicture,
      cncBackPicture,
    };

    setLoading(true);
    setSubmitError(null);
    try {
      if (isEdit && initialData?.id) {
        await updateParty(initialData.id, payload);
      } else {
        await createParty(payload);
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, isEdit ? "Failed to update party" : "Failed to save party"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Party" : "Add New Party"}
      size="xl"
      footer={
        <FormButtonsRow
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={isEdit ? "Update Party" : "Save Party"}
          isLoading={loading}
        />
      }
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <AppTextField title="Opening Date" hintText="dd/mm/yyyy" value={form.openingDate} onChange={set("openingDate")} isDateField />
          <div className="flex items-center justify-end gap-2 pb-1">
            <AppSwitch value={isActive} onChange={setIsActive} />
            <span className="text-sm text-black">{isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <AppDropDown title="Party type" items={[...PARTY_TYPES]} value={partyType} onChange={setPartyType} hintText="Select type" />
        {partySettings.partyGrouping && (
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <AppDropDown
                title="Party category"
                items={partyCategories}
                value={partyCategory}
                onChange={setPartyCategory}
                hintText="Select category"
              />
            </div>
            <button
              type="button"
              title="Add new category"
              onClick={() => {
                setAddingCategory((current) => !current);
                setAddCategoryError("");
              }}
              className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{
                backgroundColor: addingCategory ? AppColors.primary : AppColors.inputFill,
                color: addingCategory ? AppColors.white : AppColors.primary,
              }}
            >
              <span className="material-icons" style={{ fontSize: 22 }}>
                {addingCategory ? "close" : "add"}
              </span>
            </button>
          </div>

          {addingCategory && (
            <div
              className="mt-2 flex items-end gap-2 rounded-xl border p-3"
              style={{ borderColor: AppColors.lightGrey, backgroundColor: "#F7F8FB" }}
            >
              <div className="flex-1">
                <AppTextField
                  title="New Category Name"
                  hintText="e.g. Retail"
                  value={newCategoryName}
                  onChange={setNewCategoryName}
                  error={addCategoryError}
                />
              </div>
              <button
                type="button"
                disabled={addCategoryLoading}
                onClick={() => void handleAddCategory()}
                className="mb-0.5 flex h-12 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: AppColors.primary }}
              >
                {addCategoryLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: 16 }}>
                      check
                    </span>
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        )}
        <AppTextField title="Party Name" hintText="Enter Party name" value={form.partyName} onChange={set("partyName")} error={errors.partyName} />
        <AppTextField title="Opening balance" hintText="Enter Opening Balance" value={form.openingBalance} onChange={set("openingBalance")} type="number" />
        <AppTextField title="Mobile Number" hintText="+92 345 3648374" value={form.mobileNumber} onChange={set("mobileNumber")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppDropDown title="Country" items={[...COUNTRIES]} value={country} onChange={setCountry} hintText="Select Country" />
          <AppDropDown title="City" items={[...CITIES]} value={city} onChange={setCity} hintText="Select City" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppDropDown title="Area" items={[...AREAS]} value={area} onChange={setArea} hintText="Select Area" />
          <AppDropDown title="Zone" items={[...ZONES]} value={zone} onChange={setZone} hintText="Select Zone" />
        </div>
        <AppTextField title="CNC Number" hintText="00000-0000000-0" value={form.cncNumber} onChange={set("cncNumber")} />
        {partySettings.tinNumber && (
          <AppTextField title="NTN Number" hintText="Enter National Tax Number" value={form.tinNumber} onChange={set("tinNumber")} />
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageUploadBox label="CNC Front Picture" file={cncFrontPicture} onSelect={setCncFrontPicture} />
          <ImageUploadBox label="CNC Back Picture" file={cncBackPicture} onSelect={setCncBackPicture} />
        </div>
        <AppTextField title="Address" hintText="Enter complete Address" value={form.address} onChange={set("address")} maxLines={3} />
        {partySettings.partyShippingAddress && (
          <AppTextField title="Shipping Address" hintText="Leave empty if same as address" value={form.shippingAddress} onChange={set("shippingAddress")} maxLines={3} />
        )}
        <AppTextField title="Emergency Number" hintText="1234-1234567-1" value={form.emergencyNumber} onChange={set("emergencyNumber")} />
      </div>
    </AppModal>
  );
}
