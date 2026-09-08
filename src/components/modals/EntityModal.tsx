"use client";

import {
  AddProductModal,
  AddPartyModal,
  AddCategoryModal,
  AddUnitModal,
  AddServiceModal,
  AddExpenseModal,
  AddEmployeeModal,
  AddManufacturingModal,
  type EntityModalType,
} from "@/components/modals";
import type { PartyRecord } from "@/services/party-api";
import type { EmployeeRecord } from "@/services/employee-api";
import type { ExpenseRecord } from "@/services/expense-api";

interface EntityModalProps {
  type: EntityModalType;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  partyData?: PartyRecord | null;
  employeeData?: EmployeeRecord | null;
  expenseData?: ExpenseRecord | null;
}

export function EntityModal({
  type,
  open,
  onClose,
  onSuccess,
  partyData = null,
  employeeData = null,
  expenseData = null,
}: EntityModalProps) {
  const props = { open, onClose, onSuccess };

  switch (type) {
    case "party":
      return <AddPartyModal {...props} initialData={partyData} />;
    case "employee":
      return <AddEmployeeModal {...props} initialData={employeeData} />;
    case "expense":
      return <AddExpenseModal {...props} initialData={expenseData} />;
    case "product":
      return <AddProductModal {...props} />;
    case "category":
      return <AddCategoryModal {...props} />;
    case "unit":
      return <AddUnitModal {...props} />;
    case "service":
      return <AddServiceModal {...props} />;
    case "manufacturing":
      return <AddManufacturingModal {...props} />;
    default:
      return null;
  }
}
