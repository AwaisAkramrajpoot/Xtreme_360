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
} from "./AddSimpleModals";
export { AddManufacturingModal } from "./AddManufacturingModal";
export { AddExpenseModal, AddEmployeeModal } from "./AddExpenseEmployeeModals";
