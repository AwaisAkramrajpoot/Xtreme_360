"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { EntityModal } from "@/components/modals/EntityModal";
import { IconButton } from "@/components/ui/IconButton";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { AppColors } from "@/constants/colors";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import type { EntityModalType } from "@/components/modals";
import { deleteParty, getParties, type PartyRecord } from "@/services/party-api";
import { deleteEmployee, getEmployees, type EmployeeRecord } from "@/services/employee-api";
import { deleteExpense, getExpenses, type ExpenseRecord } from "@/services/expense-api";
import { getApiErrorMessage } from "@/utils/api-error";

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
  badge?: string;
}

export function PartyCard({
  name,
  type,
  balance,
  mobileNumber,
  balanceColor,
  badge,
  onEdit,
  onDelete,
}: PartyCardProps) {
  return (
    <div
      className="h-full rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] lg:p-5"
      style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 10px rgba(15,23,42,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-bold text-black">{name}</p>
            {badge && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${AppColors.primary}18`, color: AppColors.primary }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm" style={{ color: AppColors.grey }}>
            {type}
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm text-black">
            <span className="material-icons" style={{ fontSize: 16, color: AppColors.grey }}>
              call
            </span>
            {mobileNumber}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton icon="edit" label="Edit" variant="edit" onClick={onEdit} />
          <IconButton icon="delete" label="Delete" variant="delete" onClick={onDelete} />
        </div>
      </div>
      <p className="mt-3 text-base font-semibold" style={{ color: balanceColor }}>
        {balance}
      </p>
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
    <div
      className="h-full rounded-2xl border bg-white p-4 lg:p-5"
      style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 10px rgba(15,23,42,0.04)" }}
    >
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-base font-bold">#{expenseNo}</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>
            {date}
          </p>
          <p className="text-sm text-black">{category}</p>
          <p className="mt-1 text-base font-semibold" style={{ color: AppColors.primary }}>
            {totalAmount}
          </p>
        </div>
        <div className="flex gap-1">
          <IconButton icon="edit" label="Edit" variant="edit" onClick={onEdit} />
          <IconButton icon="delete" label="Delete" variant="delete" onClick={onDelete} />
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
  onSuccess?: () => void;
  partyData?: PartyRecord | null;
  employeeData?: EmployeeRecord | null;
  expenseData?: ExpenseRecord | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClearEdit?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function ListScreen({
  title,
  modalType,
  successMessage,
  children,
  onSuccess,
  partyData = null,
  employeeData = null,
  expenseData = null,
  open: controlledOpen,
  onOpenChange,
  onClearEdit,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: ListScreenProps) {
  const { isDashboardShell } = useLayoutContext();
  const modal = useModal();
  const open = controlledOpen ?? modal.open;
  const openModal = () => {
    onClearEdit?.();
    onOpenChange?.(true);
    modal.openModal();
  };
  const closeModal = () => {
    onOpenChange?.(false);
    onClearEdit?.();
    modal.closeModal();
  };
  const { showToast, Toast } = useToast();

  return (
    <div className="flex flex-col">
      <AppAppBar
        title={title}
        showNotification
        showBack={!isDashboardShell}
        showSearch
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
      />
      <div className="grid min-w-0 grid-cols-1 gap-3 pb-20 sm:gap-4 md:grid-cols-2 md:pb-4 lg:pb-4">
        {children}
      </div>
      <FloatingActionButton onClick={openModal} />
      <EntityModal
        type={modalType}
        open={open}
        onClose={closeModal}
        partyData={partyData}
        employeeData={employeeData}
        expenseData={expenseData}
        onSuccess={() => {
          showToast(successMessage);
          onSuccess?.();
        }}
      />
      {Toast}
    </div>
  );
}

function formatMoney(value?: string | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs. 0";
  return `Rs. ${amount.toLocaleString()}`;
}

export function PartyScreen() {
  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingParty, setEditingParty] = useState<PartyRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast, Toast } = useToast();

  const loadParties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getParties();
      setParties(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load parties"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParties();
  }, [loadParties]);

  const filteredParties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter((party) =>
      [
        party.party_name,
        party.party_type,
        party.party_category,
        party.mobile_number,
        party.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [parties, search]);

  const handleDelete = async (partyId: number) => {
    if (!window.confirm("Delete this party?")) return;
    try {
      await deleteParty(partyId);
      showToast("Party deleted successfully!");
      await loadParties();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete party"));
    }
  };

  return (
    <>
      <ListScreen
        title="Party List"
        modalType="party"
        successMessage={editingParty ? "Party updated successfully!" : "Party saved successfully!"}
        onSuccess={loadParties}
        partyData={editingParty}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClearEdit={() => setEditingParty(null)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search parties"
      >
        {loading && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            Loading parties...
          </p>
        )}
        {!loading && error && (
          <p className="col-span-full py-8 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && parties.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            No parties yet. Click + to add one.
          </p>
        )}
        {!loading &&
          !error &&
          filteredParties.map((party) => {
            const balanceValue = Number(party.opening_balance || 0);
            return (
              <PartyCard
                key={party.id}
                name={party.party_name}
                type={party.party_type || "Party"}
                balance={formatMoney(party.opening_balance)}
                mobileNumber={party.mobile_number || "—"}
                balanceColor={balanceValue < 0 ? AppColors.redText : AppColors.greenText}
                badge={party.is_active === false ? "Inactive" : "Active"}
                onEdit={() => {
                  setEditingParty(party);
                  setModalOpen(true);
                }}
                onDelete={() => void handleDelete(party.id)}
              />
            );
          })}
      </ListScreen>
      {Toast}
    </>
  );
}

export function ExpenseScreen() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast, Toast } = useToast();

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((expense) =>
      [
        expense.expense_no,
        expense.date,
        expense.category,
        expense.notes,
        expense.total_amount != null ? String(expense.total_amount) : null,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [expenses, search]);

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(expenseId);
      showToast("Expense deleted successfully!");
      await loadExpenses();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete expense"));
    }
  };

  return (
    <>
      <ListScreen
        title="Expense"
        modalType="expense"
        successMessage={editingExpense ? "Expense updated successfully!" : "Expense saved successfully!"}
        onSuccess={loadExpenses}
        expenseData={editingExpense}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClearEdit={() => setEditingExpense(null)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expenses"
      >
        {loading && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            Loading expenses...
          </p>
        )}
        {!loading && error && (
          <p className="col-span-full py-8 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && expenses.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            No expenses yet. Click + to add one.
          </p>
        )}
        {!loading &&
          !error &&
          filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expenseNo={expense.expense_no || String(expense.id)}
              date={expense.date || "—"}
              category={expense.category || "—"}
              totalAmount={formatMoney(expense.total_amount != null ? String(expense.total_amount) : null)}
              onEdit={() => {
                setEditingExpense(expense);
                setModalOpen(true);
              }}
              onDelete={() => void handleDelete(expense.id)}
            />
          ))}
      </ListScreen>
      {Toast}
    </>
  );
}

export function EmployeeScreen() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast, Toast } = useToast();

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) =>
      [
        employee.employee_name,
        employee.father_name,
        employee.designation,
        employee.mobile_number,
        employee.basic_salary != null ? String(employee.basic_salary) : null,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [employees, search]);

  const handleDelete = async (employeeId: number) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await deleteEmployee(employeeId);
      showToast("Employee deleted successfully!");
      await loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete employee"));
    }
  };

  return (
    <>
      <ListScreen
        title="Employee"
        modalType="employee"
        successMessage={editingEmployee ? "Employee updated successfully!" : "Employee saved successfully!"}
        onSuccess={loadEmployees}
        employeeData={editingEmployee}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClearEdit={() => setEditingEmployee(null)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employees"
      >
        {loading && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            Loading employees...
          </p>
        )}
        {!loading && error && (
          <p className="col-span-full py-8 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && employees.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            No employees yet. Click + to add one.
          </p>
        )}
        {!loading &&
          !error &&
          filteredEmployees.map((employee) => (
            <PartyCard
              key={employee.id}
              name={employee.employee_name}
              type={employee.designation || "Employee"}
              balance={employee.basic_salary ? formatMoney(employee.basic_salary) : "Active"}
              mobileNumber={employee.mobile_number || "—"}
              balanceColor={AppColors.greenText}
              badge="Employee"
              onEdit={() => {
                setEditingEmployee(employee);
                setModalOpen(true);
              }}
              onDelete={() => void handleDelete(employee.id)}
            />
          ))}
      </ListScreen>
      {Toast}
    </>
  );
}
