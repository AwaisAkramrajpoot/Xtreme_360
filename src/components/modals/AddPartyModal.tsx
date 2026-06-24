"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";

const PARTY_TYPES = ["Supplier", "Customer", "Both"] as const;
const PARTY_CATEGORIES = ["Category 1", "Category 2", "Category 3"] as const;
const COUNTRIES = ["Pakistan", "India", "Bangladesh", "United Arab Emirates", "USA"] as const;
const CITIES = ["Karachi", "Lahore", "Islamabad"] as const;
const AREAS = ["Area 1", "Area 2", "Area 3"] as const;
const ZONES = ["Zone 1", "Zone 2", "Zone 3"] as const;

interface AddPartyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPartyModal({ open, onClose, onSuccess }: AddPartyModalProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [partyType, setPartyType] = useState<string | null>(null);
  const [partyCategory, setPartyCategory] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    openingDate: "",
    partyName: "",
    openingBalance: "",
    mobileNumber: "",
    cncNumber: "",
    address: "",
    emergencyNumber: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (!form.partyName.trim()) next.partyName = "Please enter party name";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add New Party"
      size="xl"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} saveLabel="Save Party" isLoading={loading} />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <AppTextField title="Opening Date" hintText="mm/dd/yyyy" value={form.openingDate} onChange={set("openingDate")} isDateField />
          <div className="flex items-center justify-end gap-2 pb-1">
            <AppSwitch value={isActive} onChange={setIsActive} />
            <span className="text-sm text-black">{isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <AppDropDown title="Party type" items={[...PARTY_TYPES]} value={partyType} onChange={setPartyType} hintText="Select type" />
        <AppDropDown title="Party category" items={[...PARTY_CATEGORIES]} value={partyCategory} onChange={setPartyCategory} hintText="Select category" />
        <AppTextField title="Party Name" hintText="Enter Party name" value={form.partyName} onChange={set("partyName")} error={errors.partyName} />
        <AppTextField title="Opening balance" hintText="Enter Opening Balance" value={form.openingBalance} onChange={set("openingBalance")} type="number" />
        <AppTextField title="Mobile Number" hintText="+92 345 3648374" value={form.mobileNumber} onChange={set("mobileNumber")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppDropDown title="Country" items={[...COUNTRIES]} value={country} onChange={setCountry} hintText="Select Country" />
          <AppDropDown title="City" items={[...CITIES]} value={city} onChange={setCity} hintText="Select City" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppDropDown title="Area" items={[...AREAS]} value={area} onChange={setArea} hintText="Select Area" />
          <AppDropDown title="Zone" items={[...ZONES]} value={zone} onChange={setZone} hintText="Select Zone" />
        </div>
        <AppTextField title="CNC Number" hintText="00000-0000000-0" value={form.cncNumber} onChange={set("cncNumber")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm" style={{ borderColor: "#D0CFCF" }}>
            <span className="material-icons text-3xl mb-2" style={{ color: "#8C8CA1" }}>upload</span>
            <p className="font-semibold text-black">CNC Front Picture</p>
            <p className="text-xs mt-1" style={{ color: "#8C8CA1" }}>Click to upload</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm" style={{ borderColor: "#D0CFCF" }}>
            <span className="material-icons text-3xl mb-2" style={{ color: "#8C8CA1" }}>upload</span>
            <p className="font-semibold text-black">CNC Back Picture</p>
            <p className="text-xs mt-1" style={{ color: "#8C8CA1" }}>Click to upload</p>
          </div>
        </div>
        <AppTextField title="Address" hintText="Enter complete Address" value={form.address} onChange={set("address")} maxLines={3} />
        <AppTextField title="emergency Number" hintText="1234-1234567-1" value={form.emergencyNumber} onChange={set("emergencyNumber")} />
      </div>
    </AppModal>
  );
}
