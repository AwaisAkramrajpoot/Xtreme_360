import { AppConfig } from "@/constants/config";
import { formatMoney } from "@/constants/app-settings";
import { buildPrintHtml, getPrintContext } from "@/lib/print-document";
import type { PosBill, PosOrderStatus, PosOrderType, PosPaymentLine } from "@/services/pos-api";

export const ORDER_TYPES: Array<{ id: PosOrderType; label: string; icon: string }> = [
  { id: "take_away", label: "Take Away", icon: "shopping_bag" },
  { id: "dine_in", label: "Dine In", icon: "restaurant" },
  { id: "delivery", label: "Delivery", icon: "delivery_dining" },
];

export const PAYMENT_MODES = ["Cash", "Card", "Bank", "Online", "Cheque"] as const;

export const orderTypeLabel = (id?: string | null) => ORDER_TYPES.find((o) => o.id === id)?.label ?? "";

/** Delivery charges are saved as this non-stock bill line (see backend posModel). */
export const DELIVERY_CODE = "DELIVERY";
export const isDeliveryItem = (item: { item_id?: number | null; item_code?: string | null }) =>
  !item.item_id && String(item.item_code || "").toUpperCase() === DELIVERY_CODE;

export const ORDER_STATUS: Record<PosOrderStatus | "open", { label: string; bg: string; color: string; icon: string }> = {
  open: { label: "Open", bg: "#EEF2FF", color: "#3949AB", icon: "edit_note" },
  new: { label: "New", bg: "#E3F2FD", color: "#1565C0", icon: "fiber_new" },
  preparing: { label: "Preparing", bg: "#FFF3E0", color: "#E65100", icon: "soup_kitchen" },
  ready: { label: "Ready", bg: "#E8F5E9", color: "#2E7D32", icon: "room_service" },
  served: { label: "Served", bg: "#F3E5F5", color: "#7B1FA2", icon: "restaurant" },
  out_for_delivery: { label: "Out for delivery", bg: "#E0F7FA", color: "#00838F", icon: "delivery_dining" },
  completed: { label: "Completed", bg: "#F1F2F5", color: "#5B6170", icon: "task_alt" },
  cancelled: { label: "Cancelled", bg: "#FCE4EC", color: "#C2185B", icon: "cancel" },
};

/** The next kitchen/counter step for an order, or null when only payment/completion is left. */
export function nextOrderStatus(orderType: string | null | undefined, current: PosOrderStatus | null | undefined): PosOrderStatus | null {
  const flow: PosOrderStatus[] =
    orderType === "delivery"
      ? ["new", "preparing", "ready", "out_for_delivery"]
      : orderType === "dine_in"
        ? ["new", "preparing", "ready", "served"]
        : ["new", "preparing", "ready"];
  const index = flow.indexOf(current || "new");
  return index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;
}

export const RESERVATION_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  booked: { label: "Booked", bg: "#FFF8E1", color: "#B26A00" },
  seated: { label: "Seated", bg: "#E8F5E9", color: "#2E7D32" },
  completed: { label: "Completed", bg: "#F1F2F5", color: "#5B6170" },
  cancelled: { label: "Cancelled", bg: "#FCE4EC", color: "#C2185B" },
  no_show: { label: "No-show", bg: "#FBE9E7", color: "#BF360C" },
};

export const TABLE_STATUS = {
  free: { label: "Free", bg: "#F1F8F1", border: "#A5D6A7", color: "#2E7D32", dot: "#43A047" },
  occupied: { label: "Occupied", bg: "#FFF4F2", border: "#F5B7B1", color: "#C62828", dot: "#E53935" },
  reserved: { label: "Reserved", bg: "#FFF8E1", border: "#FFD54F", color: "#B26A00", dot: "#FFB300" },
} as const;

/** "12 min", "1 h 05 min" since a timestamp. */
export function elapsed(from?: string | null, now = Date.now()) {
  if (!from) return "";
  const mins = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min`;
}

export function resolveUploadUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = AppConfig.apiUrl.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatBillDate(value?: string | null) {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : String(value);
}

/** Prints a POS bill through a hidden iframe (avoids pop-up blockers after async calls). */
export function printPosBill(bill: PosBill, partyTin?: string | null) {
  const orderType = orderTypeLabel(bill.order_type);
  const html = buildPrintHtml(
    { ...bill, party_name: bill.party_name || "Walk-in Customer" },
    { title: "POS Bill", partyTin, extraMeta: orderType ? [{ label: "Order", value: orderType }] : [] }
  );
  return printHtml(html);
}

/** Prints an HTML document through a hidden iframe. Returns false if the browser blocked it. */
export function printHtml(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "pos-print");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return false;
  }
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();
  window.setTimeout(() => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1500);
    }
  }, 250);
  return true;
}

/* ------------------------------------------------------------------ */
/* Bill maths — mirrors backend computeLine/summarizeItems exactly     */
/* ------------------------------------------------------------------ */

export type CartLine = {
  key: string;
  itemId: number | null;
  itemName: string;
  itemCode?: string;
  unit?: string;
  rate: number;
  quantity: number;
  /** Line-level discount (only non-zero on bills resumed from the server). */
  discount: number;
  /** Kitchen note for this line ("no onions", "extra spicy"). */
  note?: string;
};

export type PricedLine = CartLine & { gross: number; discountTotal: number; taxAmount: number; amount: number };

const r2 = (n: number) => Number(n.toFixed(2));

/**
 * Spreads the bill discount over lines in proportion to their value (never more than a line is
 * worth), applies the bill tax % to every line, and rounds per line like the server does, so the
 * total shown is exactly the total that gets saved.
 */
export function priceCart(
  cart: CartLine[],
  { billDiscount, taxPercent, enableTax, enableDiscount }: { billDiscount: number; taxPercent: number; enableTax: boolean; enableDiscount: boolean }
) {
  const bases = cart.map((l) => Math.max(l.quantity * l.rate - (enableDiscount ? l.discount : 0), 0));
  const baseTotal = bases.reduce((s, b) => s + b, 0);
  const extra = enableDiscount ? Math.min(Math.max(billDiscount, 0), baseTotal) : 0;

  let allocated = 0;
  const lines: PricedLine[] = cart.map((line, i) => {
    let share = 0;
    if (extra > 0 && baseTotal > 0) {
      share = i === cart.length - 1 ? r2(extra - allocated) : r2((bases[i] / baseTotal) * extra);
      share = Math.min(share, bases[i]);
      allocated += share;
    }
    const gross = line.quantity * line.rate;
    const discountTotal = r2((enableDiscount ? line.discount : 0) + share);
    const taxable = Math.max(gross - discountTotal, 0);
    const rawTax = enableTax ? (taxable * (taxPercent || 0)) / 100 : 0;
    // Same rounding as the server: tax rounded on its own, amount rounded from the unrounded tax.
    return { ...line, gross: r2(gross), discountTotal, taxAmount: r2(rawTax), amount: r2(taxable + rawTax) };
  });

  return {
    lines,
    subtotal: r2(lines.reduce((s, l) => s + l.gross, 0)),
    discount: r2(lines.reduce((s, l) => s + l.discountTotal, 0)),
    tax: r2(lines.reduce((s, l) => s + l.taxAmount, 0)),
    total: r2(lines.reduce((s, l) => s + l.amount, 0)),
    itemCount: cart.reduce((s, l) => s + l.quantity, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Receipt (80 mm thermal) and kitchen order ticket                    */
/* ------------------------------------------------------------------ */

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const THERMAL_CSS = `
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: "Courier New", ui-monospace, monospace; font-size: 12px; color: #000; margin: 0; width: 72mm; }
  .c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; }
  .big { font-size: 16px; font-weight: 700; } .xl { font-size: 20px; font-weight: 800; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 1px 0; }
  .note { font-size: 11px; font-style: italic; padding-left: 8px; }
  .muted { font-size: 11px; }
  img.logo { max-width: 40mm; max-height: 18mm; display: block; margin: 0 auto 4px; }
`;

function billTime(bill: PosBill) {
  const stamp = bill.opened_at ? new Date(bill.opened_at) : new Date();
  return Number.isNaN(stamp.getTime()) ? "" : stamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function orderLines(bill: PosBill) {
  const lines: string[] = [];
  if (bill.order_type) lines.push(`<div><b>${esc(orderTypeLabel(bill.order_type))}</b>${bill.table_name ? ` &middot; Table <b>${esc(bill.table_name)}</b>` : ""}${bill.guests ? ` &middot; ${bill.guests} guests` : ""}</div>`);
  return lines.join("");
}

/** Customer receipt after payment. `tendered` is the cash handed over (for the change line). */
export function buildReceiptHtml(bill: PosBill, { tendered = 0 }: { tendered?: number } = {}) {
  const { general, business } = getPrintContext();
  const money = (v: unknown) => formatMoney(Number(v || 0), general);
  const items = bill.items || [];
  const food = items.filter((i) => !isDeliveryItem(i));
  const deliveryCharge = items.filter(isDeliveryItem).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const itemsSubtotal = food.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.rate || 0), 0);
  const discount = Number(bill.discount_total || 0);
  const tax = Number(bill.tax_total || 0);
  const total = Number(bill.total_amount || 0);
  const payments: PosPaymentLine[] = (bill.payments || []).filter((p) => Number(p.amount) > 0);
  const cashPaid = payments.filter((p) => p.mode === "Cash").reduce((s, p) => s + Number(p.amount), 0);
  const change = tendered > cashPaid ? tendered - cashPaid : 0;
  const balance = Number(bill.balance_due || 0);
  const delivery = bill.pos_meta?.delivery;
  const logo = business?.business_logo ? resolveUploadUrl(business.business_logo) : null;

  const row = (label: string, value: string, cls = "") => `<tr class="${cls}"><td>${label}</td><td class="r">${value}</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(bill.doc_no || "Receipt")}</title><style>${THERMAL_CSS}</style></head><body>
    <div class="c">
      ${logo ? `<img class="logo" src="${esc(logo)}" alt="">` : ""}
      <div class="big">${esc(business?.name || "Receipt")}</div>
      ${business?.address ? `<div class="muted">${esc(business.address)}</div>` : ""}
      ${business?.mobile_number ? `<div class="muted">Tel: ${esc(business.mobile_number)}</div>` : ""}
    </div>
    <div class="hr"></div>
    <table>
      ${row("Bill #", `<b>${esc(bill.doc_no || "")}</b>`)}
      ${row("Date", `${esc(formatBillDate(bill.doc_date))} ${esc(billTime(bill))}`)}
    </table>
    ${orderLines(bill)}
    ${bill.party_name && bill.party_name !== "Walk-in Customer" ? `<div>Customer: ${esc(bill.party_name)}</div>` : ""}
    ${bill.pos_meta?.customer_phone ? `<div>Phone: ${esc(bill.pos_meta.customer_phone)}</div>` : ""}
    ${delivery?.address ? `<div>Deliver to: ${esc(delivery.address)}</div>` : ""}
    <div class="hr"></div>
    <table>
      ${food
        .map((i) => {
          const qty = Number(i.quantity || 0);
          return `<tr><td colspan="2" class="b">${esc(i.item_name)}</td></tr>
            <tr><td>&nbsp;&nbsp;${qty} x ${esc(money(i.rate))}</td><td class="r">${esc(money(qty * Number(i.rate || 0)))}</td></tr>
            ${i.reason ? `<tr><td colspan="2" class="note">* ${esc(i.reason)}</td></tr>` : ""}`;
        })
        .join("")}
    </table>
    <div class="hr"></div>
    <table>
      ${row("Subtotal", esc(money(itemsSubtotal)))}
      ${discount > 0 ? row("Discount", `-${esc(money(discount))}`) : ""}
      ${tax > 0 ? row("Tax", esc(money(tax))) : ""}
      ${deliveryCharge > 0 ? row("Delivery charges", esc(money(deliveryCharge))) : ""}
      ${row('<span class="xl">TOTAL</span>', `<span class="xl">${esc(money(total))}</span>`)}
    </table>
    <div class="hr"></div>
    <table>
      ${payments.map((p) => row(`Paid (${esc(p.mode)})`, esc(money(p.amount)))).join("")}
      ${tendered > 0 && cashPaid > 0 ? row("Cash received", esc(money(tendered))) : ""}
      ${change > 0 ? row("<b>Change</b>", `<b>${esc(money(change))}</b>`) : ""}
      ${balance > 0 ? row("<b>Balance due</b>", `<b>${esc(money(balance))}</b>`) : ""}
    </table>
    <div class="hr"></div>
    <div class="c">Thank you for dining with us!</div>
    <div class="c muted">${esc(new Date().toLocaleString())}</div>
  </body></html>`;
}

/** Kitchen order ticket: what to cook, with notes, no prices. */
export function buildKotHtml(bill: PosBill) {
  const items = (bill.items || []).filter((i) => !isDeliveryItem(i));
  return `<!doctype html><html><head><meta charset="utf-8"><title>KOT ${esc(bill.doc_no || "")}</title><style>${THERMAL_CSS}
      td.q { width: 12mm; font-size: 16px; font-weight: 800; } td.n { font-size: 15px; font-weight: 700; }</style></head><body>
    <div class="c xl">KITCHEN ORDER</div>
    <div class="c big">${esc(orderTypeLabel(bill.order_type) || "Order")}${bill.table_name ? ` &middot; TABLE ${esc(bill.table_name)}` : ""}</div>
    <div class="hr"></div>
    <table>
      <tr><td>Order</td><td class="r b">${esc(bill.doc_no || "")}</td></tr>
      <tr><td>Time</td><td class="r">${esc(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))}</td></tr>
      ${bill.guests ? `<tr><td>Guests</td><td class="r">${bill.guests}</td></tr>` : ""}
      ${bill.party_name && bill.party_name !== "Walk-in Customer" ? `<tr><td>Customer</td><td class="r">${esc(bill.party_name)}</td></tr>` : ""}
    </table>
    <div class="hr"></div>
    <table>
      ${items
        .map(
          (i) => `<tr><td class="q">${Number(i.quantity || 0)}x</td><td class="n">${esc(i.item_name)}</td></tr>
            ${i.reason ? `<tr><td></td><td class="note">&raquo; ${esc(i.reason)}</td></tr>` : ""}`
        )
        .join("")}
    </table>
    ${bill.notes ? `<div class="hr"></div><div class="b">Note: ${esc(bill.notes)}</div>` : ""}
    <div class="hr"></div>
  </body></html>`;
}
