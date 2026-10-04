"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { formatMoney } from "@/constants/app-settings";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";
import { deleteHeldPosBill, getPosBills, type PosBill } from "@/services/pos-api";
import { formatBillDate, orderTypeLabel, printPosBill } from "./pos-shared";

export { POSTerminalScreen } from "./POSTerminal";

const TABS = [
  { id: "all", label: "All", status: undefined },
  { id: "held", label: "Held", status: "held" },
  { id: "due", label: "Due", status: "partial,unpaid" },
  { id: "paid", label: "Paid", status: "paid" },
] as const;

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  held: { bg: "#FFF8E6", color: "#8A6200" },
  paid: { bg: "#EAF6EA", color: AppColors.greenText },
  partial: { bg: "#FDECEC", color: AppColors.redText },
  unpaid: { bg: "#FDECEC", color: AppColors.redText },
};

export function POSListScreen() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const general = useSettingsStore((s) => s.app.general);
  const money = (v: number | string | null | undefined) => formatMoney(Number(v || 0), general);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const status = TABS.find((t) => t.id === tab)?.status;
  const loader = useCallback(() => getPosBills({ status, search: search.trim() || undefined }), [status, search]);
  const { data: bills, loading, error, reload } = useAsyncData(loader, [] as PosBill[], "Failed to load POS bills");

  const totals = bills.reduce(
    (acc, b) => {
      if (b.status === "held") return acc;
      acc.sales += Number(b.total_amount || 0);
      acc.due += Number(b.balance_due || 0);
      return acc;
    },
    { sales: 0, due: 0 }
  );

  const remove = async (bill: PosBill) => {
    const ok = await confirm({ title: "Delete held bill", message: `Delete ${bill.doc_no}?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteHeldPosBill(bill.id);
      showToast("Held bill deleted");
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Delete failed"), "error");
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title="POS Bills"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search bill or customer"
        actions={
          <button
            type="button"
            onClick={() => router.push(RouteName.pos)}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-white"
            style={{ backgroundColor: AppColors.primary }}
          >
            <span className="material-icons text-[18px]" aria-hidden>add</span>
            New sale
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="rounded-full border px-4 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: tab === t.id ? AppColors.primary : "white",
                color: tab === t.id ? "white" : AppColors.greyishBlack,
                borderColor: tab === t.id ? AppColors.primary : AppColors.lightGrey,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!loading && bills.length > 0 && (
          <p className="text-sm" style={{ color: AppColors.grey }}>
            Sales {money(totals.sales)}
            {totals.due > 0 ? ` · Due ${money(totals.due)}` : ""}
          </p>
        )}
      </div>

      {loading && !bills.length && (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />)}
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-red-500">
          <p>{error}</p>
          <button type="button" onClick={reload} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ backgroundColor: AppColors.primary }}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && !bills.length && (
        <p className="py-16 text-center text-sm" style={{ color: AppColors.grey }}>
          {search.trim() ? `No bills match “${search.trim()}”.` : "No POS bills here yet. Start a new sale from the terminal."}
        </p>
      )}

      <div className="grid gap-3 pb-10 md:grid-cols-2">
        {bills.map((bill) => {
          const st = String(bill.status || "").toLowerCase();
          const style = STATUS_STYLE[st] || { bg: AppColors.bgColor2, color: AppColors.greyishBlack };
          return (
            <div key={bill.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-black">{bill.doc_no}</p>
                  <p className="truncate text-sm" style={{ color: AppColors.grey }}>
                    {bill.party_name || "Walk-in Customer"} · {formatBillDate(bill.doc_date)}
                    {bill.order_type ? ` · ${orderTypeLabel(bill.order_type)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize" style={{ backgroundColor: style.bg, color: style.color }}>
                  {st || "—"}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-lg font-bold" style={{ color: AppColors.primary }}>{money(bill.total_amount)}</p>
                {Number(bill.balance_due || 0) > 0 && st !== "held" && (
                  <p className="text-sm font-semibold" style={{ color: AppColors.redText }}>Due {money(bill.balance_due)}</p>
                )}
              </div>
              <p className="text-xs" style={{ color: AppColors.grey }}>
                {(bill.items || []).length} {(bill.items || []).length === 1 ? "item" : "items"}
                {(bill.payments || []).length ? ` · ${(bill.payments || []).map((p) => `${p.mode} ${money(p.amount)}`).join(", ")}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`${RouteName.pos}?bill=${bill.id}`)}
                  className="h-9 rounded-lg px-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: AppColors.primary }}
                >
                  {st === "held" ? "Resume" : "Open"}
                </button>
                {st === "held" ? (
                  <button type="button" onClick={() => void remove(bill)} className="h-9 rounded-lg border px-3 text-sm font-semibold text-red-600" style={{ borderColor: AppColors.lightGrey }}>
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => printPosBill(bill) || showToast("Allow pop-ups to print", "error")}
                    className="h-9 rounded-lg border px-3 text-sm font-semibold"
                    style={{ borderColor: AppColors.lightGrey }}
                  >
                    Print
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {Toast}
    </div>
  );
}
