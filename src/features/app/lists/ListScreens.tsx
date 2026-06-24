"use client";

import { AppAppBar } from "@/components/ui/AppAppBar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { EntityModal } from "@/components/modals/EntityModal";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import type { EntityModalType } from "@/components/modals";

export interface ListCardAction {
  onEdit?: () => void;
  onDelete?: () => void;
}

interface PartyCardProps extends ListCardAction {
  name: string;
  type: string;
  balance: string;
  mobileNumber: string;
  balanceColor: string;
}

export function PartyCard({ name, type, balance, mobileNumber, balanceColor, onEdit, onDelete }: PartyCardProps) {
  return (
    <div className="p-4 lg:p-5 bg-white rounded-xl h-full" style={{ border: `1px solid ${AppColors.lightGrey}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-base font-bold text-black">{name}</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>{type}</p>
          <p className="text-sm text-black mt-1">{mobileNumber}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit}><AppAsset src={AppImages.edit} width={20} height={20} /></button>
          <button type="button" onClick={onDelete}><AppAsset src={AppImages.delete} width={20} height={20} /></button>
        </div>
      </div>
      <p className="text-base font-semibold mt-2" style={{ color: balanceColor }}>{balance}</p>
    </div>
  );
}

interface ExpenseCardProps extends ListCardAction {
  expenseNo: string;
  date: string;
  category: string;
  totalAmount: string;
}

export function ExpenseCard({ expenseNo, date, category, totalAmount, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <div className="p-4 lg:p-5 bg-white rounded-xl h-full" style={{ border: `1px solid ${AppColors.lightGrey}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex justify-between">
        <div>
          <p className="text-base font-bold">#{expenseNo}</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>{date}</p>
          <p className="text-sm text-black">{category}</p>
          <p className="text-base font-semibold mt-1" style={{ color: AppColors.primary }}>{totalAmount}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit}><AppAsset src={AppImages.edit} width={20} height={20} /></button>
          <button type="button" onClick={onDelete}><AppAsset src={AppImages.delete} width={20} height={20} /></button>
        </div>
      </div>
    </div>
  );
}

interface ListScreenProps {
  title: string;
  modalType: EntityModalType;
  successMessage: string;
  children: React.ReactNode;
}

export function ListScreen({ title, modalType, successMessage, children }: ListScreenProps) {
  const { isDashboardShell } = useLayoutContext();
  const { open, openModal, closeModal } = useModal();
  const { showToast, Toast } = useToast();

  return (
    <div className="flex flex-col">
      <AppAppBar title={title} showNotification showBack={!isDashboardShell} showSearch />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pb-20 md:pb-4 lg:pb-4 min-w-0">{children}</div>
      <FloatingActionButton onClick={openModal} />
      <EntityModal
        type={modalType}
        open={open}
        onClose={closeModal}
        onSuccess={() => showToast(successMessage)}
      />
      {Toast}
    </div>
  );
}

export function PartyScreen() {
  return (
    <ListScreen title="Party List" modalType="party" successMessage="Party saved successfully!">
      <PartyCard name="Supplier 1" type="Supplier" balance="Rs. 40,000" mobileNumber="+92 000 0000000" balanceColor={AppColors.redText} />
      <PartyCard name="Customer 1" type="Customer" balance="Rs. 5730" mobileNumber="+92 000 0000000" balanceColor={AppColors.greenText} />
    </ListScreen>
  );
}

export function ExpenseScreen() {
  return (
    <ListScreen title="Expense" modalType="expense" successMessage="Expense saved successfully!">
      <ExpenseCard expenseNo="1" date="30/12/2023" category="Office Supplies" totalAmount="Rs. 5,000" />
      <ExpenseCard expenseNo="2" date="29/12/2023" category="Travel" totalAmount="Rs. 12,500" />
    </ListScreen>
  );
}

export function EmployeeScreen() {
  return (
    <ListScreen title="Employee" modalType="employee" successMessage="Employee saved successfully!">
      <PartyCard name="Ahmed Khan" type="Manager" balance="Active" mobileNumber="+92 300 1112233" balanceColor={AppColors.greenText} />
      <PartyCard name="Sara Ali" type="Sales" balance="Active" mobileNumber="+92 301 4445566" balanceColor={AppColors.greenText} />
    </ListScreen>
  );
}
