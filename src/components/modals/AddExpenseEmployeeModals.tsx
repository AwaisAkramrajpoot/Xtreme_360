"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";

const EXPENSE_CATEGORIES = ["Office Supplies", "Travel", "Utilities", "Salaries", "Other"] as const;

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddExpenseModal({ open, onClose, onSuccess }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [form, setForm] = useState({
    expenseNo: "",
    date: "",
    totalAmount: "",
    notes: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
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
      title="Expense"
      size="lg"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} saveLabel="Save Expense" isLoading={loading} />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Expense No" hintText="2" value={form.expenseNo} onChange={set("expenseNo")} type="number" />
          <AppTextField title="Date" hintText="30/12/2023" value={form.date} onChange={set("date")} isDateField />
        </div>
        <AppDropDown title="Expense Category" items={[...EXPENSE_CATEGORIES]} value={category} onChange={setCategory} hintText="Select category" />
        <AppTextField title="Total Amount" hintText="0.00" value={form.totalAmount} onChange={set("totalAmount")} type="number" />
        <AppTextField title="Notes" hintText="Enter notes" value={form.notes} onChange={set("notes")} maxLines={2} />
      </div>
    </AppModal>
  );
}

interface AddEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEmployeeModal({ open, onClose, onSuccess }: AddEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    openingDate: "",
    joiningDate: "",
    employeeName: "",
    fatherName: "",
    dateOfBirth: "",
    mobileNumber: "",
    salary: "",
    designation: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.employeeName.trim()) return;
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
      title="Add New Employee"
      size="xl"
      footer={<FormButtonsRow onCancel={onClose} onSave={handleSave} saveLabel="Save Employee" isLoading={loading} />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Opening Date" hintText="mm/dd/yyyy" value={form.openingDate} onChange={set("openingDate")} isDateField />
          <AppTextField title="Joining Date" hintText="mm/dd/yyyy" value={form.joiningDate} onChange={set("joiningDate")} isDateField />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Employee Name" hintText="Type Name" value={form.employeeName} onChange={set("employeeName")} />
          <AppTextField title="Father Name" hintText="Type Father Name" value={form.fatherName} onChange={set("fatherName")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Date of Birth" hintText="mm/dd/yyyy" value={form.dateOfBirth} onChange={set("dateOfBirth")} isDateField />
          <AppTextField title="Mobile Number" hintText="+92 345 3648374" value={form.mobileNumber} onChange={set("mobileNumber")} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Designation" hintText="Enter designation" value={form.designation} onChange={set("designation")} />
          <AppTextField title="Salary" hintText="0.00" value={form.salary} onChange={set("salary")} type="number" />
        </div>
      </div>
    </AppModal>
  );
}
