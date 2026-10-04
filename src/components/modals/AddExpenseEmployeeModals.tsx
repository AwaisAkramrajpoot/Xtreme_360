"use client";

import { useEffect, useRef, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import {
  createExpense,
  updateExpense,
  getExpenseCategories,
  createExpenseCategory,
  getNextExpenseNo,
  EXPENSE_PAYMENT_MODES,
  type ExpenseRecord,
} from "@/services/expense-api";
import { getAccounts } from "@/services/cash-bank-api";
import { getApiErrorMessage } from "@/utils/api-error";
import { AppColors } from "@/constants/colors";
import { createEmployee, updateEmployee, type EmployeeRecord } from "@/services/employee-api";

const EXPENSE_CATEGORIES = ["Office Supplies", "Travel", "Utilities", "Salaries", "Other"] as const;

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: ExpenseRecord | null;
}

export function AddExpenseModal({
  open,
  onClose,
  onSuccess,
  initialData = null,
}: AddExpenseModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ amount?: string; bankAccount?: string }>({});

  /* category state */
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  /* payment: Cash, or Bank / Cheque / Online from a bank account (same as Other Income) */
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccounts, setBankAccounts] = useState<string[]>([]);

  const allCategories = [
    ...apiCategories,
    ...EXPENSE_CATEGORIES.filter((c) => !apiCategories.includes(c)),
  ];

  const [form, setForm] = useState({
    expenseNo: "",
    date: "",
    totalAmount: "",
    notes: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* load categories and bank accounts whenever modal opens */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await getExpenseCategories();
        if (!cancelled) setApiCategories(rows.map((r) => r.name));
      } catch {
        /* keep fallback list */
      }
    })();
    getAccounts("bank")
      .then((rows) => {
        if (!cancelled) setBankAccounts(rows.map((a) => a.account_name));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open]);

  /* pre-fill form on edit; new expenses get today's date and the next number */
  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setErrors({});
    if (initialData) {
      setForm({
        expenseNo: initialData.expense_no || "",
        date: initialData.date || "",
        totalAmount: initialData.total_amount != null ? String(initialData.total_amount) : "",
        notes: initialData.notes || "",
      });
      setCategory(initialData.category || null);
      setPaymentMode(initialData.payment_mode || "Cash");
      setBankAccount(initialData.bank_account || "");
      return;
    }
    setForm({ expenseNo: "", date: new Date().toLocaleDateString("en-CA"), totalAmount: "", notes: "" });
    setCategory(null);
    setPaymentMode("Cash");
    setBankAccount("");
    let cancelled = false;
    getNextExpenseNo()
      .then((no) => {
        if (!cancelled) setForm((f) => ({ ...f, expenseNo: no }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open, initialData]);

  const handleSave = async () => {
    const next: typeof errors = {};
    if (!(Number(form.totalAmount) > 0)) next.amount = "Enter an amount greater than 0";
    if (paymentMode !== "Cash" && bankAccounts.length && !bankAccount) {
      next.bankAccount = "Select the account it was paid from";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        // New expenses are numbered by the server so two open forms can't take the same number.
        expenseNo: isEdit ? form.expenseNo : undefined,
        date: form.date,
        category: category || undefined,
        totalAmount: form.totalAmount,
        notes: form.notes,
        paymentMode,
        bankAccount: paymentMode === "Cash" ? "" : bankAccount,
      };
      if (isEdit && initialData?.id) {
        await updateExpense(initialData.id, payload);
      } else {
        await createExpense(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, isEdit ? "Failed to update expense" : "Failed to save expense"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Expense" : "Add Expense"}
      size="lg"
      footer={
        <FormButtonsRow
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={isEdit ? "Update Expense" : "Save Expense"}
          isLoading={loading}
        />
      }
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Date" hintText="yyyy-mm-dd" value={form.date} onChange={set("date")} isDateField />
          <AppTextField
            title="Expense No."
            hintText="Auto"
            value={form.expenseNo || (isEdit ? "" : "…")}
            onChange={() => undefined}
            readOnly
          />
        </div>

        <AppDropDown
          title="Expense Category"
          items={allCategories}
          value={category}
          onChange={setCategory}
          hintText="Select category"
          actionLabel="Add New Category"
          onAction={() => setAddingCategory(true)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField
            title="Total Amount"
            hintText="0.00"
            value={form.totalAmount}
            onChange={set("totalAmount")}
            type="number"
            error={errors.amount}
          />
          <AppDropDown
            title="Paid From"
            items={EXPENSE_PAYMENT_MODES}
            value={paymentMode}
            onChange={setPaymentMode}
          />
        </div>
        {paymentMode !== "Cash" &&
          (bankAccounts.length ? (
            <div>
              <AppDropDown
                title="Bank Account *"
                items={bankAccounts}
                value={bankAccount || null}
                onChange={setBankAccount}
                hintText="Select bank account"
              />
              {errors.bankAccount && <p className="mt-1 text-xs text-red-500">{errors.bankAccount}</p>}
            </div>
          ) : (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }}>
              No bank accounts yet — add one in Cash &amp; Bank to track where this was paid from.
            </p>
          ))}
        <AppTextField title="Notes" hintText="Enter notes" value={form.notes} onChange={set("notes")} maxLines={2} />
      </div>

      <AddExpenseCategoryModal
        open={addingCategory}
        onClose={() => setAddingCategory(false)}
        onCreated={(name) => {
          setApiCategories((current) => (current.includes(name) ? current : [name, ...current]));
          setCategory(name);
        }}
      />
    </AppModal>
  );
}

/** "Add New Category" from the expense category dropdown. */
function AddExpenseCategoryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a category name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createExpenseCategory(trimmed);
      onCreated(trimmed);
      setName("");
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add category"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add Expense Category"
      size="sm"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} isLoading={saving} />}
    >
      <AppTextField title="Category Name" hintText="e.g. Rent" value={name} onChange={setName} error={error} />
    </AppModal>
  );
}

interface AddEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: EmployeeRecord | null;
}

function EmployeeImageUploadBox({
  label,
  file,
  existingImageUrl,
  onSelect,
}: {
  label: string;
  file: File | null;
  existingImageUrl?: string | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileLabel = file?.name || (existingImageUrl ? "Already uploaded" : "Click to upload");

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-full cursor-pointer rounded-lg border border-dashed p-4 text-center"
      style={{ borderColor: "#D0CFCF" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      <span className="material-icons text-[22px]" style={{ color: AppColors.primary }}>
        upload
      </span>
      <p className="mt-1 text-xs font-semibold text-black">{label}</p>
      <p className="mt-0.5 truncate text-[11px]" style={{ color: AppColors.grey }}>
        {fileLabel}
      </p>
    </button>
  );
}

const COUNTRIES = ["Pakistan", "India", "Bangladesh", "United Arab Emirates", "USA"] as const;
const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Multan"] as const;
const AREAS = ["Gulshan", "DHA", "Johar Town", "Saddar", "Model Town"] as const;
const ZONES = ["Zone 1", "Zone 2", "Zone 3", "Zone 4"] as const;

const emptyEmployeeForm = {
  openingDate: "",
  joiningDate: "",
  employeeName: "",
  fatherName: "",
  dateOfBirth: "",
  mobileNumber: "",
  country: "",
  city: "",
  area: "",
  zone: "",
  cncNumber: "",
  address: "",
  department: "",
  salary: "",
  designation: "",
};

export function AddEmployeeModal({
  open,
  onClose,
  onSuccess,
  initialData = null,
}: AddEmployeeModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyEmployeeForm);
  const [cncFrontPicture, setCncFrontPicture] = useState<File | null>(null);
  const [cncBackPicture, setCncBackPicture] = useState<File | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(emptyEmployeeForm);
    setCncFrontPicture(null);
    setCncBackPicture(null);
    setErrors({});
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        openingDate: initialData.opening_date || "",
        joiningDate: initialData.joining_date || "",
        employeeName: initialData.employee_name || "",
        fatherName: initialData.father_name || "",
        dateOfBirth: initialData.date_of_birth || "",
        mobileNumber: initialData.mobile_number || "",
        country: initialData.country || "",
        city: initialData.city || "",
        area: initialData.area || "",
        zone: initialData.zone || "",
        cncNumber: initialData.cnc_number || "",
        address: initialData.address || "",
        department: initialData.department || "",
        salary: initialData.basic_salary || "",
        designation: initialData.designation || "",
      });
      setCncFrontPicture(null);
      setCncBackPicture(null);
      setErrors({});
      setSubmitError(null);
      return;
    }
    resetForm();
  }, [open, initialData]);

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (!form.employeeName.trim()) next.employeeName = "Please enter employee name";
    if (!form.mobileNumber.trim()) next.mobileNumber = "Please enter mobile number";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      employeeName: form.employeeName,
      mobileNumber: form.mobileNumber,
      openingDate: form.openingDate,
      joiningDate: form.joiningDate,
      fatherName: form.fatherName,
      dateOfBirth: form.dateOfBirth,
      country: form.country || undefined,
      city: form.city || undefined,
      area: form.area || undefined,
      zone: form.zone || undefined,
      cncNumber: form.cncNumber,
      address: form.address,
      department: form.department,
      designation: form.designation,
      basicSalary: form.salary,
      cncFrontPicture,
      cncBackPicture,
    };

    setLoading(true);
    setSubmitError(null);
    try {
      if (isEdit && initialData?.id) {
        await updateEmployee(initialData.id, payload);
      } else {
        await createEmployee(payload);
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, isEdit ? "Failed to update employee" : "Failed to save employee")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "Add New Employee"}
      size="xl"
      footer={
        <FormButtonsRow
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={isEdit ? "Update Employee" : "Save Employee"}
          isLoading={loading}
        />
      }
    >
      <div className="space-y-4">
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Opening Date" hintText="dd/mm/yyyy" value={form.openingDate} onChange={set("openingDate")} isDateField />
          <AppTextField title="Joining Date" hintText="dd/mm/yyyy" value={form.joiningDate} onChange={set("joiningDate")} isDateField />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Employee Name" hintText="Type Name" value={form.employeeName} onChange={set("employeeName")} error={errors.employeeName} />
          <AppTextField title="Father Name" hintText="Type Father Name" value={form.fatherName} onChange={set("fatherName")} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Date of Birth" hintText="dd/mm/yyyy" value={form.dateOfBirth} onChange={set("dateOfBirth")} isDateField />
          <AppTextField title="Mobile Number" hintText="+92 345 3648374" value={form.mobileNumber} onChange={set("mobileNumber")} error={errors.mobileNumber} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppDropDown
            title="Country"
            items={[...COUNTRIES]}
            value={form.country ? (form.country as (typeof COUNTRIES)[number]) : null}
            onChange={(value) => set("country")(value)}
            hintText="Select Country"
          />
          <AppDropDown
            title="City"
            items={[...CITIES]}
            value={form.city ? (form.city as (typeof CITIES)[number]) : null}
            onChange={(value) => set("city")(value)}
            hintText="Select City"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppDropDown
            title="Area"
            items={[...AREAS]}
            value={form.area ? (form.area as (typeof AREAS)[number]) : null}
            onChange={(value) => set("area")(value)}
            hintText="Select Area"
          />
          <AppDropDown
            title="Zone"
            items={[...ZONES]}
            value={form.zone ? (form.zone as (typeof ZONES)[number]) : null}
            onChange={(value) => set("zone")(value)}
            hintText="Select Zone"
          />
        </div>

        <AppTextField title="CNIC Number" hintText="00000-0000000-0" value={form.cncNumber} onChange={set("cncNumber")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EmployeeImageUploadBox
            label="CNIC Front Picture"
            file={cncFrontPicture}
            existingImageUrl={initialData?.cnc_front_picture}
            onSelect={setCncFrontPicture}
          />
          <EmployeeImageUploadBox
            label="CNIC Back Picture"
            file={cncBackPicture}
            existingImageUrl={initialData?.cnc_back_picture}
            onSelect={setCncBackPicture}
          />
        </div>

        <AppTextField title="Address" hintText="Type complete Address" value={form.address} onChange={set("address")} maxLines={2} />
        <AppTextField title="Department" hintText="Department" value={form.department} onChange={set("department")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Designation" hintText="Enter designation" value={form.designation} onChange={set("designation")} />
          <AppTextField title="Basic Salary" hintText="45000" value={form.salary} onChange={set("salary")} type="number" />
        </div>
      </div>
    </AppModal>
  );
}
