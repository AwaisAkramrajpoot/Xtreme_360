"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { formatMoney } from "@/constants/app-settings";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { getApiErrorMessage } from "@/utils/api-error";
import type { ItemRecord } from "@/services/item-api";
import type { PartyRecord } from "@/services/party-api";
import {
  checkoutPosSale,
  deleteHeldPosBill,
  getActivePosOrders,
  getNextPosBillNo,
  getPosBill,
  getPosBills,
  getPosCatalog,
  getPosTables,
  holdPosSale,
  setPosReservationStatus,
  type PosBill,
  type PosDelivery,
  type PosOrderStatus,
  type PosOrderType,
  type PosReservation,
  type PosSalePayload,
  type PosTable,
} from "@/services/pos-api";
import {
  ORDER_STATUS,
  ORDER_TYPES,
  TABLE_STATUS,
  buildKotHtml,
  buildReceiptHtml,
  formatBillDate,
  isDeliveryItem,
  priceCart,
  printHtml,
  printPosBill,
  resolveUploadUrl,
  type CartLine,
} from "./pos-shared";
import { PosButton, PosField, PosPill, posInput } from "./pos-ui";
import { TablesPanel } from "./TablesPanel";
import { ReservationsPanel } from "./ReservationsPanel";
import { OrdersBoard } from "./OrdersBoard";
import { NewCustomerModal, PaymentModal, ReceiptModal, type PaymentResult } from "./PosDialogs";

type PosParty = PartyRecord & { balance?: number };
type Tab = "tables" | "register" | "orders" | "reservations";

const WALK_IN = "Walk-in Customer";
const today = () => new Date().toLocaleDateString("en-CA");
const emptyDelivery: PosDelivery = { phone: "", address: "", charges: 0, rider: "", instructions: "" };
const OPEN_STATUSES: PosOrderStatus[] = ["new", "preparing", "ready", "served", "out_for_delivery"];
const AUTO_KOT_KEY = "xtreme-pos-auto-kot";

function lineFromItem(item: ItemRecord, quantity = 1): CartLine {
  return {
    key: `item-${item.id}-${Date.now()}`,
    itemId: item.id,
    itemName: item.item_name,
    itemCode: item.item_code || undefined,
    unit: item.item_unit || undefined,
    rate: Number(item.sale_price || 0),
    quantity,
    discount: 0,
  };
}

const readAutoKot = () => {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(AUTO_KOT_KEY) === "1";
  } catch {
    return false;
  }
};

function POSTerminalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = Number(searchParams.get("bill") || 0);
  const tabParam = searchParams.get("tab") as Tab | null;
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const general = useSettingsStore((s) => s.app.general);
  const stockMaintenance = useSettingsStore((s) => s.itemSettings.stockMaintenance);
  const role = useSessionProfileStore((s) => s.user?.role) || "owner";
  const canManageTables = role === "owner" || role === "manager";
  const money = useCallback((v: number) => formatMoney(v, general), [general]);
  const notify = useCallback((message: string, type: "success" | "error" = "success") => showToast(message, type), [showToast]);
  const scanRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const [tab, setTab] = useState<Tab>(resumeId ? "register" : tabParam || "tables");

  /* ---------------- catalog ---------------- */
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [products, setProducts] = useState<ItemRecord[]>([]);
  const [parties, setParties] = useState<PosParty[]>([]);
  const [heldBills, setHeldBills] = useState<PosBill[]>([]);
  const [enableTax, setEnableTax] = useState(true);
  const [enableDiscount, setEnableDiscount] = useState(true);

  /* ---------------- restaurant ---------------- */
  const [tables, setTables] = useState<PosTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PosBill[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  /* ---------------- current order ---------------- */
  const [bill, setBill] = useState<PosBill | null>(null); // loaded from server (open or completed)
  const [docNo, setDocNo] = useState("");
  const [docDate, setDocDate] = useState(today());
  const [orderType, setOrderType] = useState<PosOrderType>("take_away");
  const [tableId, setTableId] = useState<number | null>(null);
  const [guests, setGuests] = useState<number>(0);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [partyId, setPartyId] = useState<number | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [delivery, setDelivery] = useState<PosDelivery>(emptyDelivery);
  const [orderNote, setOrderNote] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [billDiscount, setBillDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ---------------- dialogs ---------------- */
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<{ bill: PosBill; tendered: number } | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [reservedTable, setReservedTable] = useState<PosTable | null>(null);
  const [autoKot, setAutoKot] = useState(readAutoKot);

  const status = bill ? String(bill.status || "").toLowerCase() : "";
  const isOpenOrder = Boolean(bill && status === "held");
  const readOnly = Boolean(bill && !isOpenOrder);
  const selectedParty = parties.find((p) => p.id === partyId) || null;
  const selectedTable = tables.find((t) => t.id === tableId) || null;
  const priced = useMemo(
    () => priceCart(cart, { billDiscount, taxPercent, enableTax, enableDiscount }),
    [cart, billDiscount, taxPercent, enableTax, enableDiscount]
  );
  const deliveryCharges = orderType === "delivery" ? Math.max(Number(delivery.charges) || 0, 0) : 0;
  const grandTotal = Number((priced.total + deliveryCharges).toFixed(2));
  const dirty = !readOnly && cart.length > 0;

  /* ---------------- loading ---------------- */
  const refreshCatalog = useCallback(async () => {
    const [catalog, held] = await Promise.all([getPosCatalog(), getPosBills({ status: "held" })]);
    setProducts(catalog?.products || []);
    setParties((catalog?.parties || []) as PosParty[]);
    setEnableTax(catalog?.settings?.enableTax !== false);
    setEnableDiscount(catalog?.settings?.enableDiscount !== false);
    setHeldBills(held);
  }, []);

  const refreshTables = useCallback(async () => {
    try {
      setTables(await getPosTables());
      setTablesError(null);
    } catch (err) {
      setTablesError(getApiErrorMessage(err, "Failed to load tables"));
    } finally {
      setTablesLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      setOrders(await getActivePosOrders());
      setOrdersError(null);
    } catch (err) {
      setOrdersError(getApiErrorMessage(err, "Failed to load orders"));
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCatalog().catch(() => undefined), refreshTables(), refreshOrders()]);
  }, [refreshCatalog, refreshTables, refreshOrders]);

  const resetOrder = useCallback(() => {
    setBill(null);
    setCart([]);
    setNoteFor(null);
    setBillDiscount(0);
    setTaxPercent(0);
    setOrderType("take_away");
    setTableId(null);
    setGuests(0);
    setReservationId(null);
    setPartyId(null);
    setCustomerPhone("");
    setDelivery(emptyDelivery);
    setOrderNote("");
    setFieldErrors({});
    setDocDate(today());
  }, []);

  const startNewSale = useCallback(async () => {
    resetOrder();
    try {
      setDocNo(await getNextPosBillNo());
    } catch {
      setDocNo("");
    }
    window.setTimeout(() => scanRef.current?.focus(), 0);
  }, [resetOrder]);

  const applyBill = useCallback((b: PosBill) => {
    setBill(b);
    setDocNo(b.doc_no || "");
    setDocDate(String(b.doc_date || today()).slice(0, 10));
    setPartyId(b.party_id ?? null);
    setOrderType((b.order_type as PosOrderType) || "take_away");
    setTableId(b.table_id ?? null);
    setGuests(Number(b.guests || 0));
    setReservationId(b.reservation_id ?? null);
    setCustomerPhone(b.pos_meta?.customer_phone || "");
    setOrderNote(b.notes || "");
    const all = b.items || [];
    const items = all.filter((i) => !isDeliveryItem(i));
    const savedDelivery = b.pos_meta?.delivery;
    setDelivery({
      phone: savedDelivery?.phone || b.pos_meta?.customer_phone || "",
      address: savedDelivery?.address || b.delivery_address || "",
      charges: Number(savedDelivery?.charges ?? all.filter(isDeliveryItem).reduce((s, i) => s + Number(i.amount || 0), 0)),
      rider: savedDelivery?.rider || b.transporter || "",
      instructions: savedDelivery?.instructions || "",
    });
    setCart(
      items.map((item, idx) => ({
        key: `${item.item_id ?? "x"}-${idx}`,
        itemId: item.item_id ?? null,
        itemName: item.item_name,
        itemCode: item.item_code || undefined,
        unit: item.unit || undefined,
        rate: Number(item.rate || 0),
        quantity: Number(item.quantity || 1),
        // The saved discount already includes the bill discount share.
        discount: Number(item.discount || 0),
        note: item.reason || undefined,
      }))
    );
    setBillDiscount(0);
    setTaxPercent(Number(items[0]?.tax_percent || 0));
    setFieldErrors({});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshCatalog();
        if (resumeId) {
          const b = await getPosBill(resumeId);
          if (cancelled) return;
          if (b) {
            applyBill(b);
            setTab("register");
          } else showToast("Bill not found", "error");
        } else {
          const next = await getNextPosBillNo();
          if (!cancelled) setDocNo(next);
        }
        if (!cancelled) setLoadError(null);
      } catch (err) {
        if (!cancelled) setLoadError(getApiErrorMessage(err, "Failed to load POS"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, refreshCatalog, applyBill, showToast]);

  useEffect(() => {
    void (async () => {
      await Promise.all([refreshTables(), refreshOrders()]);
    })();
  }, [refreshTables, refreshOrders]);

  // Table statuses change with the clock (reservations) and other terminals.
  useEffect(() => {
    if (tab !== "tables") return;
    const id = window.setInterval(() => void refreshTables(), 30000);
    return () => window.clearInterval(id);
  }, [tab, refreshTables]);

  /* ---------------- catalog view ---------------- */
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.item_category?.trim()).filter(Boolean) as string[])).sort()],
    [products]
  );
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.item_category === category) &&
        (!q || [p.item_name, p.item_code, p.item_category].some((v) => v && v.toLowerCase().includes(q)))
    );
  }, [products, category, search]);

  const qtyInCart = useMemo(() => {
    const map: Record<number, number> = {};
    for (const l of cart) if (l.itemId) map[l.itemId] = (map[l.itemId] || 0) + l.quantity;
    return map;
  }, [cart]);

  const tracksStock = (item?: ItemRecord) => Boolean(stockMaintenance && item && (item.item_type ?? "product") === "product");
  const stockOf = (item: ItemRecord) => Number(item.opening_stock || 0);

  /* ---------------- cart ops ---------------- */
  const addItem = (item: ItemRecord, qty = 1) => {
    if (readOnly) return;
    setCart((prev) => {
      // Lines with a kitchen note stay separate ("1 burger, no onions" + "1 burger").
      const existing = prev.find((l) => l.itemId === item.id && !l.note);
      if (existing) return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + qty } : l));
      return [...prev, lineFromItem(item, qty)];
    });
  };

  const setLineQty = (key: string, qty: number) => {
    if (readOnly) return;
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: qty } : l))));
  };
  const setLineNote = (key: string, note: string) => setCart((prev) => prev.map((l) => (l.key === key ? { ...l, note } : l)));

  const onScan = () => {
    const code = search.trim().toLowerCase();
    if (!code) return;
    const exact = products.find((p) => p.item_code && p.item_code.toLowerCase() === code);
    const target = exact || (visibleProducts.length === 1 ? visibleProducts[0] : null);
    if (target) {
      addItem(target);
      setSearch("");
      showToast(`Added ${target.item_name}`);
    } else {
      showToast(visibleProducts.length ? "Several products match — tap one to add it" : `No product matches “${search.trim()}”`, "error");
    }
  };

  const pickParty = (id: number | null) => {
    setPartyId(id);
    const p = parties.find((x) => x.id === id);
    if (!p) return;
    if (p.mobile_number) {
      setCustomerPhone((v) => v || p.mobile_number || "");
      setDelivery((d) => ({ ...d, phone: d.phone || p.mobile_number || "" }));
    }
    const address = p.shipping_address || p.address;
    if (address) setDelivery((d) => ({ ...d, address: d.address || address }));
  };

  /* ---------------- save ---------------- */
  const buildPayload = (extra: Partial<PosSalePayload> = {}): PosSalePayload => ({
    billId: bill?.id ?? null,
    docNo: docNo || undefined,
    partyId,
    partyName: selectedParty?.party_name || WALK_IN,
    docDate,
    orderType,
    tableId: orderType === "dine_in" ? tableId : null,
    guests: orderType === "dine_in" ? guests || null : null,
    reservationId: orderType === "dine_in" ? reservationId : null,
    customerPhone: (orderType === "delivery" ? delivery.phone : customerPhone).trim() || undefined,
    delivery: orderType === "delivery" ? { ...delivery, charges: deliveryCharges } : null,
    notes: orderNote.trim() || undefined,
    items: priced.lines.map((l) => ({
      itemId: l.itemId,
      itemName: l.itemName,
      itemCode: l.itemCode,
      unit: l.unit,
      quantity: l.quantity,
      rate: l.rate,
      discount: l.discountTotal,
      taxPercent: enableTax ? taxPercent : 0,
      note: l.note?.trim() || undefined,
    })),
    ...extra,
  });

  /** Returns false (and shows why) when the order details are incomplete. */
  const validateOrder = () => {
    const errors: Record<string, string> = {};
    if (!cart.length) {
      showToast("Add at least one item", "error");
      return false;
    }
    if (priced.total <= 0) {
      showToast("The order total must be greater than 0", "error");
      return false;
    }
    if (orderType === "dine_in" && !tableId) errors.table = "Choose a table for dine-in";
    if (orderType === "delivery") {
      if (!delivery.phone.trim()) errors.phone = "Phone is required for delivery";
      if (!delivery.address.trim()) errors.address = "Address is required for delivery";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      showToast(Object.values(errors)[0], "error");
      return false;
    }
    return true;
  };

  const confirmStock = async () => {
    if (!stockMaintenance) return true;
    const short = cart
      .map((l) => ({ line: l, item: products.find((p) => p.id === l.itemId) }))
      .filter(({ line, item }) => tracksStock(item) && item && line.quantity > stockOf(item));
    if (!short.length) return true;
    return confirm({
      title: "Not enough stock",
      message: short.map(({ line, item }) => `${line.itemName}: selling ${line.quantity}, in stock ${stockOf(item!)}`).join("\n") + "\n\nComplete the sale anyway?",
      confirmLabel: "Sell anyway",
    });
  };

  const afterOrderClosed = async (wasDineIn: boolean) => {
    await startNewSale();
    if (resumeId) router.replace(RouteName.pos);
    setTab(wasDineIn ? "tables" : "register");
  };

  /** Saves the open order (new or edited) and sends it to the kitchen board. */
  const sendToKitchen = async () => {
    if (!validateOrder()) return;
    setBusy(true);
    try {
      const keepStatus = bill?.order_status && OPEN_STATUSES.includes(bill.order_status) ? bill.order_status : "new";
      const saved = await holdPosSale(buildPayload({ orderStatus: keepStatus }));
      if (!saved) throw new Error("Order was not saved");
      showToast(isOpenOrder ? `Order ${saved.doc_no} updated` : `Order ${saved.doc_no} sent to the kitchen`);
      if (autoKot) printHtml(buildKotHtml({ ...saved, table_name: saved.table_name ?? selectedTable?.name ?? null }));
      await refreshAll();
      await afterOrderClosed(orderType === "dine_in");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to save order"), "error");
      void refreshTables();
    } finally {
      setBusy(false);
    }
  };

  const openPayment = () => {
    if (validateOrder()) setPaying(true);
  };

  const pay = async (result: PaymentResult) => {
    if (!(await confirmStock())) return;
    setBusy(true);
    try {
      const keep = bill?.order_status && OPEN_STATUSES.includes(bill.order_status) ? bill.order_status : "new";
      const saved = await checkoutPosSale(
        buildPayload({ payments: result.payments, receivedAmount: result.receivedAmount, orderStatus: result.completed ? "completed" : keep })
      );
      if (!saved) throw new Error("Payment was not saved");
      setPaying(false);
      setReceipt({ bill: { ...saved, table_name: saved.table_name ?? selectedTable?.name ?? null }, tendered: result.tendered });
      showToast(`Paid · ${saved.doc_no}`);
      await refreshAll();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to complete payment"), "error");
    } finally {
      setBusy(false);
    }
  };

  const discardOrder = async () => {
    if (!bill || !isOpenOrder) return;
    const ok = await confirm({
      title: "Discard open order",
      message: `Discard ${bill.doc_no}${selectedTable ? ` on table ${selectedTable.name}` : ""}? The table becomes free and nothing is charged.`,
      confirmLabel: "Discard order",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteHeldPosBill(bill.id);
      showToast(`${bill.doc_no} discarded`);
      await refreshAll();
      await afterOrderClosed(orderType === "dine_in");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to discard order"), "error");
    } finally {
      setBusy(false);
    }
  };

  /** Asks before throwing away an unsaved cart. */
  const leaveCurrent = async () => {
    if (!dirty || isOpenOrder) return true;
    return confirm({ title: "Leave this order?", message: "Items in the current cart haven't been saved. Send the order to the kitchen first to keep it.", confirmLabel: "Leave", danger: true });
  };

  const openBill = async (id: number) => {
    if (!(await leaveCurrent())) return;
    setTab("register");
    router.push(`${RouteName.pos}?bill=${id}`);
  };

  const startOrder = async ({ type, table, reservation }: { type: PosOrderType; table?: PosTable | null; reservation?: PosReservation | null }) => {
    if (!(await leaveCurrent())) return;
    await startNewSale();
    if (resumeId) router.replace(RouteName.pos);
    setOrderType(type);
    if (table) {
      setTableId(table.id);
      setGuests(reservation?.guests || 0);
    }
    if (reservation) {
      setReservationId(reservation.id);
      if (reservation.party_id) setPartyId(reservation.party_id);
      setCustomerPhone(reservation.customer_phone || "");
      setOrderNote(reservation.notes || "");
    }
    setTab("register");
  };

  const pickTable = async (t: PosTable) => {
    if (t.status === "occupied" && t.order_id) return void openBill(t.order_id);
    if (t.status === "occupied" && t.seated_reservation_id) {
      return void startOrder({
        type: "dine_in",
        table: t,
        reservation: { id: t.seated_reservation_id, customer_name: t.seated_customer || "", guests: t.order_guests || 0 } as PosReservation,
      });
    }
    if (t.status === "reserved") return setReservedTable(t);
    return void startOrder({ type: "dine_in", table: t });
  };

  const seatReservedTable = async (t: PosTable) => {
    if (!t.reservation_id) return;
    setReservedTable(null);
    try {
      const r = await setPosReservationStatus(t.reservation_id, "seated", t.id);
      showToast(`${t.reservation_customer} seated at ${t.name}`);
      void refreshTables();
      await startOrder({ type: "dine_in", table: t, reservation: r });
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to seat guests"), "error");
    }
  };

  const onSeated = (r: PosReservation) => {
    if (r.order_id) return void openBill(r.order_id);
    const table = tables.find((t) => t.id === r.table_id) || ({ id: r.table_id, name: r.table_name } as PosTable);
    void startOrder({ type: "dine_in", table, reservation: r });
  };

  const switchTab = async (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    if (next === "tables") void refreshTables();
    if (next === "orders") void refreshOrders();
  };

  const changeOrderType = (type: PosOrderType) => {
    setOrderType(type);
    setFieldErrors({});
    if (type !== "dine_in") {
      setTableId(null);
      setReservationId(null);
    }
  };

  /* ---------------- render ---------------- */
  if (loadError) {
    return (
      <div className="flex min-h-full flex-col">
        <AppAppBar title="POS" showBack />
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-red-500">
          <p>{loadError}</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ backgroundColor: AppColors.primary }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const occupied = tables.filter((t) => t.status === "occupied").length;
  const tabs: Array<{ id: Tab; label: string; icon: string; badge?: string }> = [
    { id: "tables", label: "Tables", icon: "table_restaurant", badge: tables.length ? `${occupied}/${tables.length}` : undefined },
    { id: "register", label: isOpenOrder ? `Order ${docNo}` : readOnly ? `Bill ${docNo}` : "New Order", icon: "point_of_sale", badge: dirty ? String(priced.itemCount) : undefined },
    { id: "orders", label: "Orders", icon: "soup_kitchen", badge: orders.length ? String(orders.length) : undefined },
    { id: "reservations", label: "Reservations", icon: "event_seat" },
  ];
  const orderMeta = bill?.order_status ? ORDER_STATUS[bill.order_status] : null;
  const defaultCompleted =
    orderType === "dine_in" || !(bill?.order_status && ["new", "preparing"].includes(bill.order_status) && isOpenOrder);

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title="POS"
        subtitle="Restaurant point of sale"
        showBack
        actions={
          <Link href={RouteName.posList} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-semibold text-[#1F2937] hover:bg-[#F3F4F6]" style={{ borderColor: AppColors.lightGrey }}>
            <span className="material-icons text-[18px]" aria-hidden>receipt_long</span>
            Bills
          </Link>
        }
      />

      <nav className="mb-4 flex gap-1 rounded-2xl border bg-white p-1" style={{ borderColor: AppColors.lightGrey }} aria-label="POS sections">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => void switchTab(t.id)}
              aria-current={active ? "page" : undefined}
              className="inline-flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-xl px-2 text-[11px] font-semibold transition-colors sm:h-11 sm:flex-row sm:gap-2 sm:px-4 sm:text-sm"
              style={{ backgroundColor: active ? AppColors.primary : "transparent", color: active ? "#fff" : "#374151" }}
            >
              <span aria-hidden className="material-icons text-[20px]">{t.icon}</span>
              <span className="max-w-full truncate">{t.label}</span>
              {t.badge && (
                <span className="min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-bold leading-5" style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "#EAF2EA", color: active ? "#fff" : AppColors.primary }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {tab === "tables" && (
        <TablesPanel tables={tables} loading={tablesLoading} error={tablesError} canManage={canManageTables} money={money} onReload={() => void refreshTables()} onPick={(t) => void pickTable(t)} notify={notify} />
      )}

      {tab === "orders" && (
        <OrdersBoard orders={orders} loading={ordersLoading} error={ordersError} money={money} onReload={refreshOrders} onOpen={(o) => void openBill(o.id)} notify={notify} />
      )}

      {tab === "reservations" && (
        <ReservationsPanel
          tables={tables}
          parties={parties}
          onSeated={onSeated}
          onChanged={() => void refreshTables()}
          notify={notify}
        />
      )}

      {tab === "register" && (
        <>
          {readOnly && bill && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "#CFE3CF", backgroundColor: "#F1F8F1" }}>
              <p className="text-sm text-black">
                <b>{bill.doc_no}</b> is {status === "paid" ? "completed and paid" : `saved (${status})`}. Completed bills can&apos;t be changed here — use Sales Return for returns.
              </p>
              <div className="flex gap-2">
                <PosButton icon="receipt" onClick={() => printHtml(buildReceiptHtml(bill)) || showToast("Allow pop-ups to print", "error")}>Receipt</PosButton>
                <PosButton icon="print" onClick={() => printPosBill(bill, selectedParty?.tin_number) || showToast("Allow pop-ups to print", "error")}>A4 invoice</PosButton>
                <PosButton variant="primary" icon="add" onClick={() => void afterOrderClosed(false)}>New order</PosButton>
              </div>
            </div>
          )}

          <div className="grid flex-1 gap-4 pb-8 xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* ---------------- products ---------------- */}
            <section className="min-w-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: AppColors.grey }} aria-hidden>
                    qr_code_scanner
                  </span>
                  <input
                    ref={scanRef}
                    autoFocus
                    disabled={readOnly}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onScan();
                      }
                    }}
                    placeholder="Search menu or scan barcode"
                    aria-label="Search or scan products"
                    className={`${posInput} pl-10`}
                    style={{ borderColor: AppColors.lightGrey }}
                  />
                </div>
                <select
                  value={bill && isOpenOrder ? String(bill.id) : "new"}
                  disabled={busy}
                  onChange={(e) => (e.target.value === "new" ? void startOrder({ type: "take_away" }) : void openBill(Number(e.target.value)))}
                  aria-label="Open orders"
                  className={`${posInput} sm:w-56`}
                  style={{ borderColor: AppColors.lightGrey }}
                >
                  <option value="new">{readOnly ? "Start new order" : `New order${docNo && !bill ? ` · ${docNo}` : ""}`}</option>
                  {heldBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      Open · {b.doc_no}{b.table_name ? ` · ${b.table_name}` : ""} · {money(Number(b.total_amount || 0))}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={docDate}
                  disabled={readOnly}
                  onChange={(e) => e.target.value && setDocDate(e.target.value)}
                  aria-label="Bill date"
                  className={`${posInput} sm:w-44`}
                  style={{ borderColor: AppColors.lightGrey }}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium"
                    style={{ borderColor: category === c ? AppColors.primary : AppColors.lightGrey, color: category === c ? AppColors.primary : AppColors.greyishBlack, backgroundColor: category === c ? "#EAF2EA" : "white" }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />)}
                </div>
              ) : !products.length ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border bg-white py-14 text-center text-sm" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
                  <span className="material-icons text-5xl" aria-hidden>inventory_2</span>
                  No menu items yet.
                  <Link href={RouteName.itemManagement} className="font-semibold" style={{ color: AppColors.primary }}>Add items in Item Management</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {visibleProducts.map((item) => {
                    const inCart = qtyInCart[item.id] || 0;
                    const img = resolveUploadUrl(item.item_image);
                    const stock = stockOf(item);
                    const tracked = tracksStock(item);
                    const low = tracked && stock > 0 && Number(item.min_stock_qty || 0) > 0 && stock <= Number(item.min_stock_qty);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => addItem(item)}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(88,129,87,0.12)] disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        style={{ borderColor: inCart ? AppColors.primary : AppColors.lightGrey }}
                      >
                        {inCart > 0 && (
                          <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white" style={{ backgroundColor: AppColors.primary }}>
                            {inCart}
                          </span>
                        )}
                        <span className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: AppColors.bgColor2 }}>
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="material-icons text-3xl" style={{ color: AppColors.primary }} aria-hidden>
                              {(item.item_type ?? "product") === "service" ? "handyman" : "restaurant_menu"}
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-2 text-sm font-semibold text-black">{item.item_name}</span>
                        <span className="mt-auto flex flex-col pt-1">
                          <span className="text-sm font-bold" style={{ color: AppColors.primary }}>{money(Number(item.sale_price || 0))}</span>
                          {tracked && (
                            <span className="text-[11px] font-medium" style={{ color: stock <= 0 ? AppColors.redText : low ? "#B7791F" : AppColors.grey }}>
                              {stock <= 0 ? "Out of stock" : `${stock} in stock`}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {!visibleProducts.length && (
                    <p className="col-span-full py-10 text-center text-sm" style={{ color: AppColors.grey }}>
                      No items match{search.trim() ? ` “${search.trim()}”` : " this category"}.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ---------------- order panel ---------------- */}
            <aside ref={panelRef} className="flex h-fit scroll-mt-4 flex-col rounded-2xl border bg-white xl:sticky xl:top-4 xl:max-h-[max(30rem,calc(100dvh-19rem))]" style={{ borderColor: AppColors.lightGrey }}>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-black">{isOpenOrder ? `Order ${docNo}` : readOnly ? `Bill ${docNo}` : "New order"}</p>
                  <p className="text-xs" style={{ color: AppColors.grey }}>{formatBillDate(docDate)}{!bill && docNo ? ` · ${docNo}` : ""}</p>
                </div>
                {orderMeta && <PosPill bg={orderMeta.bg} color={orderMeta.color} icon={orderMeta.icon}>{orderMeta.label}</PosPill>}
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ backgroundColor: AppColors.bgColor2 }} role="radiogroup" aria-label="Order type">
                {ORDER_TYPES.map((o) => {
                  const active = orderType === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={readOnly || (isOpenOrder && o.id !== orderType && orderType === "dine_in")}
                      onClick={() => changeOrderType(o.id)}
                      className="flex h-11 flex-col items-center justify-center rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
                      style={{ backgroundColor: active ? "#fff" : "transparent", color: active ? AppColors.primary : "#4B5563", boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : undefined }}
                    >
                      <span aria-hidden className="material-icons text-[18px]">{o.icon}</span>
                      {o.label}
                    </button>
                  );
                })}
              </div>

              {orderType === "dine_in" && (
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <PosField label="Table" required error={fieldErrors.table}>
                    <select
                      value={tableId ?? ""}
                      disabled={readOnly}
                      onChange={(e) => { setTableId(Number(e.target.value) || null); setFieldErrors((f) => ({ ...f, table: "" })); }}
                      className={posInput}
                      style={{ borderColor: fieldErrors.table ? "#E57373" : AppColors.lightGrey }}
                    >
                      <option value="">Choose a table</option>
                      {tables
                        .filter((t) => t.is_active && (t.status !== "occupied" || t.id === tableId || t.order_id === bill?.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}{t.area ? ` · ${t.area}` : ""} · {t.capacity} seats{t.status === "reserved" && t.id !== tableId ? ` · reserved ${t.reservation_time}` : ""}
                          </option>
                        ))}
                    </select>
                  </PosField>
                  <PosField label="Guests">
                    <input type="number" min={0} max={200} disabled={readOnly} value={guests || ""} placeholder="0" onChange={(e) => setGuests(Math.max(0, Number(e.target.value) || 0))} className={posInput} style={{ borderColor: AppColors.lightGrey }} />
                  </PosField>
                  {selectedTable && (
                    <p className="col-span-2 -mt-1 flex items-center gap-1.5 text-xs" style={{ color: TABLE_STATUS[selectedTable.status].color }}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TABLE_STATUS[selectedTable.status].dot }} aria-hidden />
                      {reservationId ? "Reservation · " : ""}Table {selectedTable.name} · {selectedTable.capacity} seats
                      {guests > selectedTable.capacity ? " · more guests than seats" : ""}
                    </p>
                  )}
                </div>
              )}

              {orderType === "delivery" && (
                <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: AppColors.lightGrey }}>
                  <div className="grid grid-cols-2 gap-2">
                    <PosField label="Phone" required error={fieldErrors.phone}>
                      <input type="tel" disabled={readOnly} value={delivery.phone} onChange={(e) => { setDelivery({ ...delivery, phone: e.target.value }); setFieldErrors((f) => ({ ...f, phone: "" })); }} className={posInput} style={{ borderColor: fieldErrors.phone ? "#E57373" : AppColors.lightGrey }} placeholder="03xx xxxxxxx" />
                    </PosField>
                    <PosField label="Delivery charges">
                      <input type="number" min={0} disabled={readOnly} value={delivery.charges || ""} placeholder="0" onChange={(e) => setDelivery({ ...delivery, charges: Math.max(0, Number(e.target.value) || 0) })} className={posInput} style={{ borderColor: AppColors.lightGrey }} />
                    </PosField>
                  </div>
                  <PosField label="Address" required error={fieldErrors.address}>
                    <textarea rows={2} disabled={readOnly} value={delivery.address} onChange={(e) => { setDelivery({ ...delivery, address: e.target.value }); setFieldErrors((f) => ({ ...f, address: "" })); }} className={`${posInput} h-auto py-2`} style={{ borderColor: fieldErrors.address ? "#E57373" : AppColors.lightGrey }} placeholder="House, street, area, landmark" />
                  </PosField>
                  <div className="grid grid-cols-2 gap-2">
                    <PosField label="Rider">
                      <input disabled={readOnly} value={delivery.rider || ""} onChange={(e) => setDelivery({ ...delivery, rider: e.target.value })} className={posInput} style={{ borderColor: AppColors.lightGrey }} placeholder="Optional" />
                    </PosField>
                    <PosField label="Instructions">
                      <input disabled={readOnly} value={delivery.instructions || ""} onChange={(e) => setDelivery({ ...delivery, instructions: e.target.value })} className={posInput} style={{ borderColor: AppColors.lightGrey }} placeholder="Optional" />
                    </PosField>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="pos-customer" className="text-sm font-semibold text-black">Customer</label>
                  <div className="flex items-center gap-2">
                    {selectedParty && (
                      <span className="text-xs" style={{ color: (selectedParty.balance || 0) > 0 ? AppColors.redText : AppColors.grey }}>
                        {(selectedParty.balance || 0) > 0 ? `Owes ${money(selectedParty.balance || 0)}` : (selectedParty.balance || 0) < 0 ? `Credit ${money(-(selectedParty.balance || 0))}` : "No balance"}
                      </span>
                    )}
                    {!readOnly && (
                      <button type="button" onClick={() => setNewCustomer(true)} className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: AppColors.primary }}>
                        <span aria-hidden className="material-icons text-[16px]">person_add</span>New
                      </button>
                    )}
                  </div>
                </div>
                <select id="pos-customer" value={partyId ?? ""} disabled={readOnly} onChange={(e) => pickParty(Number(e.target.value) || null)} className={posInput} style={{ borderColor: AppColors.lightGrey }}>
                  <option value="">{WALK_IN}</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.party_name}{p.mobile_number ? ` · ${p.mobile_number}` : ""}</option>
                  ))}
                </select>
                {orderType === "take_away" && !readOnly && (
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone (optional)" aria-label="Customer phone" className={`${posInput} mt-2 h-10`} style={{ borderColor: AppColors.lightGrey }} />
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-black">Items · {priced.itemCount}</h2>
                  {cart.length > 0 && !readOnly && (
                    <button type="button" onClick={() => setCart([])} className="text-xs font-semibold" style={{ color: AppColors.redText }}>Clear</button>
                  )}
                </div>
                <div className="space-y-2">
                  {priced.lines.map((line) => (
                    <div key={line.key} className="rounded-xl border p-2.5" style={{ borderColor: AppColors.lightGrey }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-black">{line.itemName}</p>
                          <p className="text-xs" style={{ color: AppColors.grey }}>
                            {money(line.rate)}{line.unit ? ` / ${line.unit}` : ""}
                            {line.discountTotal > 0 ? ` · −${money(line.discountTotal)}` : ""}
                          </p>
                          {line.note && noteFor !== line.key && <p className="mt-0.5 text-xs italic text-amber-700">» {line.note}</p>}
                        </div>
                        <p className="shrink-0 text-sm font-bold tabular-nums">{money(line.amount)}</p>
                      </div>
                      {!readOnly ? (
                        <>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button type="button" aria-label={`Decrease ${line.itemName}`} onClick={() => setLineQty(line.key, line.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border text-lg" style={{ borderColor: AppColors.lightGrey }}>−</button>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                aria-label={`Quantity of ${line.itemName}`}
                                value={line.quantity}
                                onChange={(e) => setLineQty(line.key, Math.max(0, Number(e.target.value) || 0))}
                                className="h-8 w-14 rounded-lg border text-center text-sm font-bold tabular-nums outline-none focus:border-[#588157]"
                                style={{ borderColor: AppColors.lightGrey }}
                              />
                              <button type="button" aria-label={`Increase ${line.itemName}`} onClick={() => setLineQty(line.key, line.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white" style={{ backgroundColor: AppColors.primary }}>+</button>
                            </div>
                            <div className="flex items-center gap-1">
                              <button type="button" aria-label={`Note for ${line.itemName}`} title="Kitchen note" onClick={() => setNoteFor(noteFor === line.key ? null : line.key)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-amber-50" style={{ color: line.note ? "#B26A00" : AppColors.grey }}>
                                <span className="material-icons text-[19px]" aria-hidden>sticky_note_2</span>
                              </button>
                              <button type="button" aria-label={`Remove ${line.itemName}`} onClick={() => setLineQty(line.key, 0)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50" style={{ color: AppColors.redText }}>
                                <span className="material-icons text-[20px]" aria-hidden>delete_outline</span>
                              </button>
                            </div>
                          </div>
                          {noteFor === line.key && (
                            <input
                              autoFocus
                              value={line.note || ""}
                              maxLength={300}
                              onChange={(e) => setLineNote(line.key, e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && setNoteFor(null)}
                              onBlur={() => setNoteFor(null)}
                              placeholder="e.g. no onions, extra spicy"
                              aria-label={`Kitchen note for ${line.itemName}`}
                              className={`${posInput} mt-2 h-9`}
                              style={{ borderColor: "#FFD54F" }}
                            />
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>Qty {line.quantity}</p>
                      )}
                    </div>
                  ))}
                  {!cart.length && (
                    <p className="rounded-xl border border-dashed py-8 text-center text-xs" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
                      Tap a menu item or scan a barcode to add it
                    </p>
                  )}
                </div>
              </div>

              {!readOnly && (
                <details className="group rounded-xl border px-3 py-2" style={{ borderColor: AppColors.lightGrey }} open={billDiscount > 0 || taxPercent > 0 || Boolean(orderNote) || undefined}>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-black">
                    <span>{[enableDiscount && "Discount", enableTax && "Tax", "Note"].filter(Boolean).join(" · ")}</span>
                    <span aria-hidden className="material-icons text-[20px] transition-transform group-open:rotate-180" style={{ color: AppColors.grey }}>expand_more</span>
                  </summary>
                <div className={`mt-2 grid gap-3 ${enableDiscount && enableTax ? "grid-cols-2" : "grid-cols-1"}`}>
                  {enableDiscount && (
                    <PosField label="Discount (amount)">
                      <input type="number" min={0} value={billDiscount || ""} placeholder="0" onChange={(e) => setBillDiscount(Math.max(0, Number(e.target.value) || 0))} className={`${posInput} h-10`} style={{ borderColor: AppColors.lightGrey }} />
                    </PosField>
                  )}
                  {enableTax && (
                    <PosField label="Tax %">
                      <input type="number" min={0} max={100} value={taxPercent || ""} placeholder="0" onChange={(e) => setTaxPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className={`${posInput} h-10`} style={{ borderColor: AppColors.lightGrey }} />
                    </PosField>
                  )}
                  <div className={enableDiscount && enableTax ? "col-span-2" : ""}>
                    <input value={orderNote} onChange={(e) => setOrderNote(e.target.value)} maxLength={300} placeholder="Order note (optional)" aria-label="Order note" className={`${posInput} h-10`} style={{ borderColor: AppColors.lightGrey }} />
                  </div>
                </div>
                </details>
              )}
              </div>

              <div className="space-y-3 rounded-b-2xl border-t p-4" style={{ borderColor: AppColors.lightGrey, backgroundColor: "#FCFCFD" }}>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt style={{ color: AppColors.grey }}>Subtotal</dt><dd className="tabular-nums">{money(priced.subtotal)}</dd></div>
                {enableDiscount && priced.discount > 0 && <div className="flex justify-between"><dt style={{ color: AppColors.grey }}>Discount</dt><dd className="tabular-nums">−{money(priced.discount)}</dd></div>}
                {enableTax && priced.tax > 0 && <div className="flex justify-between"><dt style={{ color: AppColors.grey }}>Tax</dt><dd className="tabular-nums">{money(priced.tax)}</dd></div>}
                {deliveryCharges > 0 && <div className="flex justify-between"><dt style={{ color: AppColors.grey }}>Delivery charges</dt><dd className="tabular-nums">{money(deliveryCharges)}</dd></div>}
                <div className="flex justify-between pt-1 text-xl font-extrabold"><dt>Total</dt><dd className="tabular-nums" style={{ color: AppColors.primary }}>{money(grandTotal)}</dd></div>
              </dl>

              {!readOnly && (
                <div className="space-y-2">
                  <PosButton variant="primary" icon="payments" className="h-14 w-full text-base" disabled={busy || !cart.length} onClick={openPayment}>
                    Pay · {money(grandTotal)}
                  </PosButton>
                  <div className="grid grid-cols-2 gap-2">
                    <PosButton icon={isOpenOrder ? "save" : "soup_kitchen"} className="h-11" loading={busy && !paying} disabled={!cart.length} onClick={() => void sendToKitchen()}>
                      {isOpenOrder ? "Update order" : "Send to kitchen"}
                    </PosButton>
                    {isOpenOrder ? (
                      <PosButton variant="danger" icon="delete_sweep" className="h-11" disabled={busy} onClick={() => void discardOrder()}>Discard</PosButton>
                    ) : (
                      <PosButton icon="print" className="h-11" disabled={!cart.length} onClick={() => printHtml(buildKotHtml({ ...buildPreviewBill(), table_name: selectedTable?.name ?? null })) || showToast("Allow pop-ups to print", "error")}>
                        Print KOT
                      </PosButton>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs" style={{ color: AppColors.grey }}>
                    <input
                      type="checkbox"
                      checked={autoKot}
                      onChange={(e) => {
                        setAutoKot(e.target.checked);
                        try {
                          window.localStorage.setItem(AUTO_KOT_KEY, e.target.checked ? "1" : "0");
                        } catch {
                          /* preference only */
                        }
                      }}
                      style={{ accentColor: AppColors.primary }}
                    />
                    Print kitchen ticket when sending to the kitchen
                  </label>
                </div>
              )}
              {readOnly && bill && (
                <p className="text-center text-xs" style={{ color: AppColors.grey }}>
                  {formatBillDate(bill.doc_date)} · {(bill.payments || []).map((p) => p.mode).join(" + ") || bill.payment_mode || "—"}
                </p>
              )}
              </div>
            </aside>
          </div>

          {/* Phones/tablets: the order panel sits under the menu, so keep the total one tap away. */}
          {!readOnly && cart.length > 0 && (
            <button
              type="button"
              onClick={() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="fixed inset-x-4 bottom-24 z-30 flex h-14 items-center justify-between rounded-2xl px-5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] xl:hidden"
              style={{ backgroundColor: AppColors.primary }}
            >
              <span className="text-sm font-semibold">View order · {priced.itemCount} {priced.itemCount === 1 ? "item" : "items"}</span>
              <span className="text-base font-extrabold tabular-nums">{money(grandTotal)}</span>
            </button>
          )}
        </>
      )}

      {paying && (
        <PaymentModal
          total={grandTotal}
          money={money}
          hasCustomer={Boolean(partyId)}
          defaultCompleted={defaultCompleted}
          completedHint={
            orderType === "dine_in"
              ? "Closes the bill and frees the table."
              : "Untick to keep the order on the Orders board while the kitchen prepares it."
          }
          busy={busy}
          onClose={() => setPaying(false)}
          onConfirm={(r) => void pay(r)}
        />
      )}

      {receipt && (
        <ReceiptModal
          bill={receipt.bill}
          tendered={receipt.tendered}
          onClose={() => {
            const wasDineIn = receipt.bill.order_type === "dine_in";
            setReceipt(null);
            void afterOrderClosed(wasDineIn);
          }}
          onNewOrder={() => {
            const wasDineIn = receipt.bill.order_type === "dine_in";
            setReceipt(null);
            void afterOrderClosed(wasDineIn);
          }}
        />
      )}

      {newCustomer && (
        <NewCustomerModal
          onClose={() => setNewCustomer(false)}
          onCreated={(p) => {
            setNewCustomer(false);
            setParties((list) => [...list, { ...p, balance: 0 }]);
            setPartyId(p.id);
            if (p.mobile_number) {
              setCustomerPhone(p.mobile_number);
              setDelivery((d) => ({ ...d, phone: d.phone || p.mobile_number || "" }));
            }
            const address = p.shipping_address || p.address;
            if (address) setDelivery((d) => ({ ...d, address: d.address || address }));
            showToast(`${p.party_name} added`);
          }}
        />
      )}

      {reservedTable && (
        <AppModal open onClose={() => setReservedTable(null)} title={`Table ${reservedTable.name} is reserved`} titleIcon="event_seat" size="sm">
          <div className="space-y-3">
            <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: TABLE_STATUS.reserved.bg, color: TABLE_STATUS.reserved.color }}>
              <p className="font-bold">{reservedTable.reservation_customer}</p>
              <p>
                {reservedTable.reservation_time} · {reservedTable.reservation_guests} guests
                {reservedTable.reservation_phone ? ` · ${reservedTable.reservation_phone}` : ""}
              </p>
            </div>
            <PosButton variant="primary" icon="how_to_reg" className="h-12 w-full" onClick={() => void seatReservedTable(reservedTable)}>
              Guests arrived · Seat &amp; take order
            </PosButton>
            <PosButton icon="restaurant" className="h-11 w-full" onClick={() => { const t = reservedTable; setReservedTable(null); void startOrder({ type: "dine_in", table: t }); }}>
              Use for a walk-in anyway
            </PosButton>
            <PosButton variant="ghost" icon="event_note" className="w-full" onClick={() => { setReservedTable(null); setTab("reservations"); }}>
              View reservations
            </PosButton>
          </div>
        </AppModal>
      )}

      {Toast}
    </div>
  );

  /** The unsaved cart as a bill, for printing a kitchen ticket before saving. */
  function buildPreviewBill(): PosBill {
    return {
      id: 0,
      doc_type: "sales_invoice",
      doc_no: docNo,
      order_type: orderType,
      guests: guests || null,
      party_name: selectedParty?.party_name || WALK_IN,
      notes: orderNote || null,
      items: priced.lines.map((l) => ({ item_id: l.itemId, item_name: l.itemName, quantity: l.quantity, rate: l.rate, reason: l.note || null })),
    } as PosBill;
  }
}

export function POSTerminalScreen() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-white" />}>
      <POSTerminalInner />
    </Suspense>
  );
}
