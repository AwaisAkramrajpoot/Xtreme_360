import { AppConfig } from "@/constants/config";
import {
  formatMoney,
  type GeneralUiSettings,
  type InvoicePrintSettings,
} from "@/constants/app-settings";
import type { BusinessRecord } from "@/services/session-api";
import type { SalesDocument } from "@/services/sales-api";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { useSettingsStore } from "@/stores/settings-store";

export type PrintOptions = {
  title: string;
  /** Delivery notes can hide rates and totals (General › Print amount on Delivery Note). */
  showAmounts?: boolean;
  /** Extra header lines, e.g. POS order type. */
  extraMeta?: Array<{ label: string; value: string }>;
  partyTin?: string | null;
};

type PrintContext = {
  print: InvoicePrintSettings;
  general: GeneralUiSettings;
  showTax: boolean;
  showDiscount: boolean;
  addTime: boolean;
  business: BusinessRecord | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveAssetUrl(path?: string | null) {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path)) return path;
  const base = AppConfig.apiUrl.replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDate(value: string | null | undefined, format: string) {
  if (!value) return "-";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  if (!y || !m || !d) return String(value);
  if (format === "mm/dd/yyyy") return `${m}/${d}/${y}`;
  if (format === "yyyy-mm-dd") return `${y}-${m}-${d}`;
  return `${d}/${m}/${y}`;
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Reads the current settings and business profile from the stores. */
export function getPrintContext(): PrintContext {
  const settings = useSettingsStore.getState();
  return {
    print: settings.app.invoicePrint,
    general: settings.app.general,
    showTax: settings.enableTax,
    showDiscount: settings.enableDiscount,
    addTime: settings.app.transaction.addTime,
    business: useSessionProfileStore.getState().business,
  };
}

const COPY_LABELS = ["ORIGINAL", "DUPLICATE", "TRIPLICATE", "QUADRUPLICATE", "COPY"];

/** Builds printable HTML for a sales document or POS bill, honouring Invoice Print settings. */
export function buildPrintHtml(doc: SalesDocument, options: PrintOptions, ctx = getPrintContext()) {
  const { print, general, business } = ctx;
  const thermal = print.defaultPrinter === "Thermal";
  const showAmounts = options.showAmounts !== false;
  const money = (value: unknown) =>
    escapeHtml(
      formatMoney(Number(value || 0), general, {
        grouping: print.amountGrouping,
        decimals: print.amountWithDecimal,
      })
    );
  const bold = (html: string) => (thermal && !print.textStyling ? html : `<b>${html}</b>`);

  const items = doc.items || [];
  const showDiscountCol = showAmounts && ctx.showDiscount;
  const showTaxCol = showAmounts && ctx.showTax;
  const columns = [
    "#",
    "Item",
    "Qty",
    ...(showAmounts ? ["Rate"] : []),
    ...(showDiscountCol && !thermal ? ["Disc"] : []),
    ...(showTaxCol && !thermal ? ["Tax"] : []),
    ...(showAmounts ? ["Amount"] : []),
  ];

  const itemRows = items.map((item, index) => {
    const cells = [
      String(index + 1),
      escapeHtml(item.item_name || "-"),
      escapeHtml(item.quantity ?? 0),
      ...(showAmounts ? [money(item.rate)] : []),
      ...(showDiscountCol && !thermal ? [money(item.discount)] : []),
      ...(showTaxCol && !thermal ? [`${escapeHtml(item.tax_percent ?? 0)}%`] : []),
      ...(showAmounts ? [money(item.amount ?? Number(item.quantity || 0) * Number(item.rate || 0))] : []),
    ];
    return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
  });
  for (let i = items.length; i < print.minRowsItemTable; i += 1) {
    itemRows.push(`<tr class="pad">${columns.map(() => "<td>&nbsp;</td>").join("")}</tr>`);
  }
  if (!itemRows.length) itemRows.push(`<tr><td colspan="${columns.length}">No items</td></tr>`);

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const logo = print.companyLogo ? resolveAssetUrl(business?.business_logo) : null;
  const companyLines = [
    print.printCompanyName && business?.name ? `<div class="company">${bold(escapeHtml(business.name))}</div>` : "",
    print.address && business?.address ? `<div>${escapeHtml(business.address)}</div>` : "",
    print.phone && business?.mobile_number ? `<div>Phone: ${escapeHtml(business.mobile_number)}</div>` : "",
    print.email && business?.email ? `<div>Email: ${escapeHtml(business.email)}</div>` : "",
  ].join("");

  const time = ctx.addTime ? formatTime(doc.created_at) : "";
  const meta = [
    { label: "No", value: doc.doc_no || `#${doc.id}` },
    { label: "Party", value: doc.party_name || "-" },
    ...(print.tinOnSale && options.partyTin ? [{ label: "Party NTN", value: options.partyTin }] : []),
    { label: "Date", value: `${formatDate(doc.doc_date, general.dateFormat)}${time ? ` ${time}` : ""}` },
    ...(options.extraMeta || []),
    { label: "Status", value: doc.payment_status || doc.status || "-" },
    ...(print.paymentMode && doc.payment_mode ? [{ label: "Payment", value: doc.payment_mode }] : []),
  ];

  const discountTotal = Number(doc.discount_total || 0);
  const totals = showAmounts
    ? [
        `<div>Subtotal: ${money(doc.subtotal)}</div>`,
        ctx.showDiscount && print.taxDetails ? `<div>Discount: ${money(discountTotal)}</div>` : "",
        ctx.showTax && print.taxDetails ? `<div>Tax: ${money(doc.tax_total)}</div>` : "",
        `<div class="grand">${bold(`Grand Total: ${money(doc.total_amount)}`)}</div>`,
        print.receivedAmount && doc.received_amount != null ? `<div>Received: ${money(doc.received_amount)}</div>` : "",
        print.balanceAmount && doc.balance_due != null ? `<div>Balance: ${money(doc.balance_due)}</div>` : "",
        !thermal && print.youSaved && discountTotal > 0 ? `<div>You saved: ${money(discountTotal)}</div>` : "",
      ].join("")
    : "";

  const footer = [
    print.printDescription && doc.notes ? `<p>${bold("Notes:")} ${escapeHtml(doc.notes)}</p>` : "",
    print.printDescription && doc.terms ? `<p>${bold("Terms:")} ${escapeHtml(doc.terms)}</p>` : "",
    !thermal && (print.receivedBy || print.deliveredBy)
      ? `<div class="sign-row">${print.receivedBy ? `<div class="sign">Received by</div>` : ""}${
          print.deliveredBy ? `<div class="sign">Delivered by</div>` : ""
        }</div>`
      : "",
    print.signatureText
      ? `<div class="signatory"><div class="sign">For ${escapeHtml(business?.name || "Authorised Signatory")}</div></div>`
      : "",
    !thermal && print.acknowledgment
      ? `<div class="ack">${bold("Acknowledgement")}<br/>Received the above goods / payment in good condition.<div class="sign">Customer signature</div></div>`
      : "",
  ].join("");

  const copies = Math.max(1, Math.min(5, print.numberOfCopies || 1));
  const pages = Array.from({ length: copies }, (_, copyIndex) => {
    const copyLabel =
      !thermal && print.printOriginalDuplicate
        ? `<div class="copy-label">${COPY_LABELS[Math.min(copyIndex, COPY_LABELS.length - 1)]}</div>`
        : "";
    return `
      <section class="page">
        ${!thermal ? "<br/>".repeat(print.extraSpaceTop) : ""}
        ${copyLabel}
        <header class="head">
          ${logo ? `<img class="logo" src="${escapeHtml(logo)}" alt="" />` : ""}
          <div>${companyLines}</div>
        </header>
        <h1>${bold(escapeHtml(options.title))}</h1>
        <div class="meta">${meta
          .map((m) => `<div>${bold(`${escapeHtml(m.label)}:`)} ${escapeHtml(m.value)}</div>`)
          .join("")}</div>
        <table>
          <thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${itemRows.join("")}</tbody>
        </table>
        ${print.totalItemQty && items.length ? `<div class="qty">Total quantity: ${escapeHtml(totalQty)}</div>` : ""}
        <div class="totals">${totals}</div>
        ${footer}
        ${thermal ? "<br/>".repeat(print.extraLinesEnd) : ""}
      </section>`;
  }).join("");

  const pageCss = thermal
    ? `@page{size:80mm auto;margin:3mm} body{width:74mm;margin:0 auto;padding:0;font-size:12px}
       h1{font-size:15px;text-align:center} .head{flex-direction:column;text-align:center}
       th,td{border:0;border-bottom:1px dashed #999;padding:3px 2px;font-size:11px}
       .totals{text-align:right}`
    : `body{padding:24px;font-size:13px} th,td{border:1px solid #ddd;padding:8px;font-size:12px}
       th{background:#f5f5f5} .totals{text-align:right}`;

  return `<!DOCTYPE html>
    <html><head><meta charset="utf-8" /><title>${escapeHtml(options.title)} ${escapeHtml(doc.doc_no || "")}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#111}
      .page{page-break-after:always} .page:last-child{page-break-after:auto}
      .head{display:flex;gap:12px;align-items:center;margin-bottom:10px}
      .logo{max-height:64px;max-width:120px;object-fit:contain}
      .company{font-size:16px}
      h1{margin:8px 0 6px;font-size:20px;font-weight:normal}
      .meta{margin-bottom:10px;color:#333} .meta div{margin:2px 0}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{text-align:left} thead{display:${print.printRepeatHeader ? "table-header-group" : "table-row-group"}}
      .qty{margin-top:6px}
      .totals{margin-top:12px} .totals div{margin:2px 0} .grand{font-size:15px}
      .copy-label{text-align:right;font-size:11px;letter-spacing:1px;color:#555}
      .sign-row{display:flex;justify-content:space-between;gap:24px;margin-top:40px}
      .signatory{display:flex;justify-content:flex-end;margin-top:40px}
      .sign{border-top:1px solid #333;padding-top:4px;min-width:160px;text-align:center;margin-top:28px}
      .ack{margin-top:24px;padding-top:12px;border-top:1px dashed #999}
      ${pageCss}
      @media print{body{padding:0}}
    </style></head><body>${pages}</body></html>`;
}
