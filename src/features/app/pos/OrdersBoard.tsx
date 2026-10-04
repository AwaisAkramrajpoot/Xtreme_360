"use client";

import { useEffect, useMemo, useState } from "react";
import { AppColors } from "@/constants/colors";
import { getApiErrorMessage } from "@/utils/api-error";
import { setPosOrderStatus, type PosBill, type PosOrderStatus } from "@/services/pos-api";
import { ORDER_STATUS, ORDER_TYPES, buildKotHtml, elapsed, isDeliveryItem, nextOrderStatus, orderTypeLabel, printHtml } from "./pos-shared";
import { PosButton, PosEmpty, PosPill } from "./pos-ui";

const STEP_LABEL: Partial<Record<PosOrderStatus, string>> = {
  preparing: "Start preparing",
  ready: "Mark ready",
  served: "Mark served",
  out_for_delivery: "Out for delivery",
};

type Props = {
  orders: PosBill[];
  loading: boolean;
  error: string | null;
  money: (v: number) => string;
  onReload: () => void;
  /** Open an unpaid order in the register (to edit it or take payment). */
  onOpen: (order: PosBill) => void;
  notify: (message: string, type?: "success" | "error") => void;
};

export function OrdersBoard({ orders, loading, error, money, onReload, onOpen, notify }: Props) {
  const [type, setType] = useState<"all" | string>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 30000);
    const refresh = window.setInterval(onReload, 45000); // pick up orders from other terminals
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, [onReload]);

  const visible = useMemo(() => orders.filter((o) => type === "all" || o.order_type === type), [orders, type]);

  const move = async (order: PosBill, status: PosOrderStatus) => {
    setBusyId(order.id);
    try {
      await setPosOrderStatus(order.id, status);
      notify(`${order.doc_no}: ${ORDER_STATUS[status].label}`);
      onReload();
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to update order"), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: "all", label: "All orders", icon: "list_alt" }, ...ORDER_TYPES].map((o) => {
          const active = type === o.id;
          const count = o.id === "all" ? orders.length : orders.filter((x) => x.order_type === o.id).length;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setType(o.id)}
              aria-pressed={active}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold"
              style={{ backgroundColor: active ? AppColors.primary : "#fff", color: active ? "#fff" : "#374151", borderColor: active ? AppColors.primary : AppColors.lightGrey }}
            >
              <span aria-hidden className="material-icons text-[17px]">{o.icon}</span>
              {o.label} · {count}
            </button>
          );
        })}
        <PosButton className="ml-auto" icon="refresh" onClick={onReload} loading={loading && orders.length > 0}>Refresh</PosButton>
      </div>

      {error ? (
        <PosEmpty icon="error_outline" title={error} action={<PosButton icon="refresh" onClick={onReload}>Try again</PosButton>} />
      ) : loading && !orders.length ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : !visible.length ? (
        <PosEmpty icon="soup_kitchen" title="No active orders" hint="Orders sent to the kitchen and paid orders still being prepared appear here." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((o) => {
            const open = String(o.status).toLowerCase() === "held";
            const status = (o.order_status as PosOrderStatus) || null;
            const meta = status ? ORDER_STATUS[status] : ORDER_STATUS.open;
            const next = nextOrderStatus(o.order_type, status);
            const items = (o.items || []).filter((i) => !isDeliveryItem(i));
            const age = Math.floor((now - new Date(o.opened_at || now).getTime()) / 60000);
            const late = age >= 30 && status !== "ready" && status !== "served";
            const typeIcon = ORDER_TYPES.find((t) => t.id === o.order_type)?.icon ?? "receipt";
            return (
              <article key={o.id} className="flex flex-col rounded-2xl border bg-white" style={{ borderColor: late ? "#F5B7B1" : AppColors.lightGrey }}>
                <header className="flex items-start justify-between gap-2 border-b px-4 py-3" style={{ borderColor: AppColors.lightGrey }}>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-base font-bold text-black">
                      <span aria-hidden className="material-icons text-[20px]" style={{ color: AppColors.primary }}>{typeIcon}</span>
                      {o.table_name ? `Table ${o.table_name}` : orderTypeLabel(o.order_type) || "Order"}
                    </p>
                    <p className="truncate text-xs" style={{ color: AppColors.grey }}>
                      {o.doc_no}
                      {o.party_name && o.party_name !== "Walk-in Customer" ? ` · ${o.party_name}` : ""}
                      {o.guests ? ` · ${o.guests} guests` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PosPill bg={meta.bg} color={meta.color} icon={meta.icon}>{meta.label}</PosPill>
                    <span className="text-[11px] font-semibold" style={{ color: late ? AppColors.redText : AppColors.grey }}>
                      <span aria-hidden className="material-icons align-middle text-[13px]">schedule</span> {elapsed(o.opened_at, now)}
                    </span>
                  </div>
                </header>

                <ul className="flex-1 space-y-1 px-4 py-3 text-sm">
                  {items.map((i, idx) => (
                    <li key={`${i.id ?? idx}`}>
                      <span className="font-bold tabular-nums">{Number(i.quantity)}×</span> {i.item_name}
                      {i.reason && <span className="block pl-6 text-xs italic text-amber-700">» {i.reason}</span>}
                    </li>
                  ))}
                  {o.order_type === "delivery" && o.delivery_address && (
                    <li className="pt-1 text-xs" style={{ color: AppColors.grey }}>
                      <span aria-hidden className="material-icons align-middle text-[14px]">place</span> {o.delivery_address}
                      {o.pos_meta?.delivery?.phone ? ` · ${o.pos_meta.delivery.phone}` : ""}
                      {o.transporter ? ` · Rider: ${o.transporter}` : ""}
                    </li>
                  )}
                </ul>

                <footer className="space-y-2 border-t px-4 py-3" style={{ borderColor: AppColors.lightGrey }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold tabular-nums">{money(Number(o.total_amount || 0))}</span>
                    <PosPill bg={open ? "#FFF3E0" : "#E8F5E9"} color={open ? "#E65100" : "#2E7D32"}>{open ? "Unpaid" : "Paid"}</PosPill>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {next && (
                      <PosButton variant="primary" icon={ORDER_STATUS[next].icon} loading={busyId === o.id} onClick={() => void move(o, next)}>
                        {STEP_LABEL[next]}
                      </PosButton>
                    )}
                    {open ? (
                      <PosButton icon="point_of_sale" onClick={() => onOpen(o)}>Open · Pay</PosButton>
                    ) : (
                      <PosButton icon="task_alt" loading={!next && busyId === o.id} onClick={() => void move(o, "completed")}>
                        {o.order_type === "delivery" ? "Delivered" : "Handed over"}
                      </PosButton>
                    )}
                    <PosButton icon="print" title="Print kitchen ticket" onClick={() => printHtml(buildKotHtml(o)) || notify("Allow pop-ups to print", "error")}>KOT</PosButton>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
