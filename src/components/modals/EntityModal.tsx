"use client";

import {
  AddProductModal,
  AddPartyModal,
  AddCategoryModal,
  AddUnitModal,
  AddServiceModal,
  AddExpenseModal,
  AddEmployeeModal,
  type EntityModalType,
} from "@/components/modals";

interface EntityModalProps {
  type: EntityModalType;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EntityModal({ type, open, onClose, onSuccess }: EntityModalProps) {
  const props = { open, onClose, onSuccess };

  switch (type) {
    case "party":
      return <AddPartyModal {...props} />;
    case "employee":
      return <AddEmployeeModal {...props} />;
    case "expense":
      return <AddExpenseModal {...props} />;
    case "product":
      return <AddProductModal {...props} />;
    case "category":
      return <AddCategoryModal {...props} />;
    case "unit":
      return <AddUnitModal {...props} />;
    case "service":
      return <AddServiceModal {...props} />;
    default:
      return null;
  }
}
