export type EntityModalType =
  | "party"
  | "employee"
  | "expense"
  | "product"
  | "category"
  | "unit"
  | "service";

export { AddProductModal } from "./AddProductModal";
export { AddPartyModal } from "./AddPartyModal";
export { AddCategoryModal, AddUnitModal, AddServiceModal } from "./AddSimpleModals";
export { AddExpenseModal, AddEmployeeModal } from "./AddExpenseEmployeeModals";
