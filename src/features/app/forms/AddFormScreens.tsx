"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AppModal } from "@/components/ui/AppModal";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { AppColors } from "@/constants/colors";
import { useLayoutContext } from "@/components/layout/LayoutContext";

interface AddFormScreenProps {
  title: string;
  fields: Array<{
    title: string;
    hintText: string;
    isPassword?: boolean;
    isDate?: boolean;
    maxLines?: number;
  }>;
  submitLabel?: string;
  showActiveToggle?: boolean;
  onSubmit?: () => void;
}

export function AddFormScreen({
  title,
  fields,
  submitLabel = "Save",
  showActiveToggle,
  onSubmit,
}: AddFormScreenProps) {
  const router = useRouter();
  const { isDashboardShell } = useLayoutContext();
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col">
      <AppAppBar title={title} showNotification showBack showAvatar={!isDashboardShell} />
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl p-5 lg:p-8 border" style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {showActiveToggle && (
          <div className="flex justify-end items-center gap-2 mb-4">
            <AppSwitch value={isActive} onChange={setIsActive} />
            <span className="text-sm text-black">{isActive ? "Active" : "Inactive"}</span>
          </div>
        )}
        <div className="space-y-4">
          {fields.map((field) => (
            <AppTextField
              key={field.title}
              title={field.title}
              hintText={field.hintText}
              isPasswordField={field.isPassword}
              isDateField={field.isDate}
              maxLines={field.maxLines}
            />
          ))}
        </div>
        <div className="h-8" />
        <AppButton
          text={submitLabel}
          isLoading={loading}
          onClick={() => {
            setLoading(true);
            onSubmit?.();
            setTimeout(() => router.back(), 600);
          }}
        />
        <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

// Pre-configured add screens matching Flutter
export function AddPartyScreen() {
  return (
    <AddFormScreen
      title="Add New Party"
      showActiveToggle
      submitLabel="Save Party"
      fields={[
        { title: "Opening Date", hintText: "mm/dd/yyyy", isDate: true },
        { title: "Party Name", hintText: "Enter party name" },
        { title: "Mobile Number", hintText: "Enter mobile number" },
        { title: "Email", hintText: "Enter email" },
        { title: "Party Type", hintText: "Customer / Supplier" },
        { title: "Opening Balance", hintText: "0.00" },
        { title: "Address", hintText: "Enter address", maxLines: 2 },
      ]}
    />
  );
}

export function AddEmployeeScreen() {
  return (
    <AddFormScreen
      title="Add Employee"
      submitLabel="Save Employee"
      fields={[
        { title: "Employee Name", hintText: "Enter name" },
        { title: "Mobile Number", hintText: "Enter mobile" },
        { title: "Email", hintText: "Enter email" },
        { title: "Designation", hintText: "Enter designation" },
        { title: "Salary", hintText: "Enter salary" },
      ]}
    />
  );
}

export function AddExpenseScreen() {
  return (
    <AddFormScreen
      title="Add Expense"
      submitLabel="Save Expense"
      fields={[
        { title: "Date", hintText: "dd/mm/yyyy", isDate: true },
        { title: "Category", hintText: "Select category" },
        { title: "Amount", hintText: "Enter amount" },
        { title: "Description", hintText: "Enter description", maxLines: 2 },
      ]}
    />
  );
}

export function AddProductScreen() {
  return (
    <AddFormScreen
      title="Add Product"
      submitLabel="Save Product"
      fields={[
        { title: "Product Name", hintText: "Enter product name" },
        { title: "Category", hintText: "Select category" },
        { title: "Unit", hintText: "Select unit" },
        { title: "Sale Price", hintText: "0.00" },
        { title: "Purchase Price", hintText: "0.00" },
        { title: "Opening Stock", hintText: "0" },
      ]}
    />
  );
}

export function AddCategoryScreen() {
  return <AddFormScreen title="Add Category" fields={[{ title: "Category Name", hintText: "Enter category name" }]} />;
}

export function AddUnitScreen() {
  return <AddFormScreen title="Add Unit" fields={[{ title: "Unit Name", hintText: "Enter unit name" }, { title: "Short Name", hintText: "e.g. kg" }]} />;
}

export function AddServiceScreen() {
  return <AddFormScreen title="Add Service" fields={[{ title: "Service Name", hintText: "Enter service name" }, { title: "Price", hintText: "0.00" }]} />;
}

export function AddBankAccountScreen() {
  return (
    <AddFormScreen
      title="Add Bank Account"
      fields={[
        { title: "Account Name", hintText: "Enter account name" },
        { title: "Bank Name", hintText: "Enter bank name" },
        { title: "Account Number", hintText: "Enter account number" },
        { title: "Opening Balance", hintText: "0.00" },
      ]}
    />
  );
}

export function GenericTransactionScreen({ title }: { title: string }) {
  const { isDashboardShell } = useLayoutContext();
  const { open, openModal, closeModal } = useModal();
  const { showToast, Toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [party, setParty] = useState("");
  const [date, setDate] = useState("");

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    showToast(`${title} saved successfully!`);
    closeModal();
  };

  return (
    <div className="flex flex-col">
      <AppAppBar title={title} showNotification showSearch showBack={!isDashboardShell} />
      <div className="p-0 lg:p-2">
        <div className="p-4 rounded-xl bg-white border" style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p className="font-bold text-black">Sample Record #001</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>Date: 30/12/2023</p>
          <p className="text-sm text-black mt-1">Amount: Rs. 10,000</p>
        </div>
      </div>
      <FloatingActionButton onClick={openModal} />
      <AppModal
        open={open}
        onClose={closeModal}
        title={`Add ${title}`}
        size="lg"
        footer={<FormButtonsRow onCancel={closeModal} onSave={handleSave} isLoading={loading} />}
      >
        <div className="space-y-4">
          <AppTextField title="Party" hintText="Select party" value={party} onChange={setParty} />
          <AppTextField title="Date" hintText="dd/mm/yyyy" value={date} onChange={setDate} isDateField />
        </div>
      </AppModal>
      {Toast}
    </div>
  );
}
