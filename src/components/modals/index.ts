export type EntityModalType =
  | "party"
  | "employee"
  | "expense"
  | "product"
  | "category"
  | "unit"
  | "service"
  | "manufacturing";

export { AddProductModal } from "./AddProductModal";
export { AddPartyModal } from "./AddPartyModal";
export {
  AddCategoryModal,
  AddUnitModal,
  AddServiceModal,
  AddManufacturingModal,
} from "./AddSimpleModals";
export { AddExpenseModal, AddEmployeeModal } from "./AddExpenseEmployeeModals";
