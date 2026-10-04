"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { fieldErrors, saveCompany, type CompanyRecord } from "@/services/super-admin-api";
import { LogoUpload, ModalFooter, SA, SelectInput, TextInput, friendlyError } from "./ui";

const BUSINESS_TYPES = ["Retail", "Distribution", "Whole Sale"];
const BUSINESS_CATEGORIES = [
  "Other",
  "Food",
  "Restaurant",
  "Bakery",
  "Crockery",
  "Dairy",
  "Poultry",
  "Banquet",
  "Catering",
  "Kitchen",
  "Pak wan Center",
  "Motor Parts",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Form = {
  name: string;
  email: string;
  mobile_number: string;
  address: string;
  website: string;
  description: string;
  type: string;
  category: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
};

const fromCompany = (c: CompanyRecord | null): Form => ({
  name: c?.name ?? "",
  email: c?.email ?? "",
  mobile_number: c?.mobile_number ?? "",
  address: c?.address ?? "",
  website: c?.website ?? "",
  description: c?.description ?? "",
  type: c?.type || "Retail",
  category: c?.category || "Other",
  owner_name: "",
  owner_email: "",
  owner_password: "",
});

const options = (list: string[], current: string) =>
  (current && !list.includes(current) ? [current, ...list] : list).map((v) => ({ value: v, label: v }));

/** "Business Profile" form: create (with the owner's login) or edit a company. */
export function CompanyModal({
  company,
  onClose,
  onSaved,
}: {
  company: CompanyRecord | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const isEdit = Boolean(company);
  const [form, setForm] = useState<Form>(() => fromCompany(company));
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const rest = { ...e };
      delete rest[key];
      return rest;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Business name is required";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email";
    if (!form.mobile_number.trim()) next.mobile_number = "Number is required";
    if (!form.address.trim()) next.address = "Business address is required";
    if (form.website.trim() && !/^https?:\/\/\S+\.\S+/i.test(form.website.trim())) {
      next.website = "Website must start with http:// or https://";
    }
    if (!isEdit) {
      if (!form.owner_name.trim()) next.owner_name = "Owner name is required";
      if (!EMAIL_RE.test(form.owner_email.trim())) next.owner_email = "Enter the owner's login email";
      if (form.owner_password && form.owner_password.length < 8) next.owner_password = "At least 8 characters";
    }
    return next;
  };

  const save = async () => {
    const next = validate();
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    const body = new FormData();
    const fields: (keyof Form)[] = ["name", "email", "mobile_number", "address", "website", "description", "type", "category"];
    if (!isEdit) fields.push("owner_name", "owner_email", "owner_password");
    for (const key of fields) body.append(key, form[key].trim());
    if (logo) body.append("business_logo", logo);
    else if (isEdit && removeLogo) body.append("remove_logo", "true");

    setSaving(true);
    try {
      const result = await saveCompany(company?.id ?? null, body);
      onSaved(result.message || (isEdit ? "Company updated" : "Company created"));
      onClose();
    } catch (err) {
      const server = fieldErrors(err);
      setErrors({
        ...server,
        ...(server.mobileNumber ? { mobile_number: server.mobileNumber } : {}),
      });
      setSubmitError(friendlyError(err, "Failed to save company"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={isEdit ? "Edit Business Profile" : "Business Profile"}
      titleIcon="domain"
      size="lg"
      footer={
        <ModalFooter
          onReset={() => {
            setForm(fromCompany(company));
            setLogo(null);
            setRemoveLogo(false);
            setErrors({});
            setSubmitError("");
          }}
          onSave={() => void save()}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        {submitError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}
        <TextInput label="Business Name" value={form.name} onChange={set("name")} placeholder="TechCorp Solutions" error={errors.name} required />
        <LogoUpload
          label="Business Logo"
          file={logo}
          existingUrl={removeLogo ? null : company?.business_logo}
          onFile={setLogo}
          onRemoveExisting={() => setRemoveLogo(true)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Number" icon="call" value={form.mobile_number} onChange={set("mobile_number")} placeholder="+1 (555) 123-2345" error={errors.mobile_number} required />
          <TextInput label="Email" icon="mail_outline" type="email" value={form.email} onChange={set("email")} placeholder="info@company.com" error={errors.email} required />
        </div>
        <TextInput label="Business Address" icon="location_on" value={form.address} onChange={set("address")} placeholder="Khanewal" error={errors.address} required />
        <TextInput label="Website" icon="language" value={form.website} onChange={set("website")} placeholder="https://www.example.com" error={errors.website} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Business Type" value={form.type} onChange={set("type")} options={options(BUSINESS_TYPES, form.type)} />
          <SelectInput label="Business Category" value={form.category} onChange={set("category")} options={options(BUSINESS_CATEGORIES, form.category)} />
        </div>
        <TextInput label="Business Description" value={form.description} onChange={set("description")} placeholder="What the business does" multiline />

        {isEdit ? (
          <p className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: "#F1F2F5", color: SA.muted }}>
            Owner login: {company?.owner_name} · {company?.owner_email}
          </p>
        ) : (
          <fieldset className="space-y-4 rounded-lg border p-4" style={{ borderColor: SA.border }}>
            <legend className="px-1 text-sm font-semibold" style={{ color: SA.text }}>
              Owner Login
            </legend>
            <p className="text-xs" style={{ color: SA.muted }}>
              The owner signs in to Xtreme 360 with this email. If the email already has an account without a company,
              the company is linked to it and the password can be left empty.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput label="Owner Name" icon="person_outline" value={form.owner_name} onChange={set("owner_name")} error={errors.owner_name} required />
              <TextInput label="Owner Email" icon="alternate_email" type="email" value={form.owner_email} onChange={set("owner_email")} error={errors.owner_email} required autoComplete="off" />
            </div>
            <TextInput
              label="Temporary Password"
              icon="lock_outline"
              type="password"
              value={form.owner_password}
              onChange={set("owner_password")}
              placeholder="At least 8 characters"
              error={errors.owner_password}
              autoComplete="new-password"
            />
          </fieldset>
        )}
      </div>
    </AppModal>
  );
}
