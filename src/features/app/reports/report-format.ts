import { formatMoney, type GeneralUiSettings } from "@/constants/app-settings";
import type { ReportColumn, ReportResult, ReportRow, ReportValueType } from "@/services/reports-api";

export const REPORTS_ROUTE = "/reports";
export const reportPath = (key: string) => `${REPORTS_ROUTE}/${key}`;

type Money = Pick<GeneralUiSettings, "currency" | "decimalPlaces" | "dateFormat">;

const pad = (n: number) => String(n).padStart(2, "0");
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function formatReportDate(value: unknown, format: string) {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  if (!y || !m || !d) return String(value);
  if (format === "mm/dd/yyyy") return `${m}/${d}/${y}`;
  if (format === "yyyy-mm-dd") return `${y}-${m}-${d}`;
  return `${d}/${m}/${y}`;
}

export function formatReportValue(value: unknown, type: ReportValueType, settings: Money) {
  if (value === null || value === undefined || value === "") return type === "text" ? "—" : "";
  switch (type) {
    case "money":
      return formatMoney(Number(value), settings);
    case "number":
      return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "date":
      return formatReportDate(value, settings.dateFormat);
    default:
      return String(value);
  }
}

export const isNumericType = (type: ReportValueType) => type === "money" || type === "number" || type === "percent";

/* ---------------- date presets ---------------- */

export const DATE_PRESETS = ["Today", "This week", "This month", "Last month", "This quarter", "This year", "Custom"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export function presetRange(preset: DatePreset, now = new Date()): { from: string; to: string } | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = toIsoDate(now);
  switch (preset) {
    case "Today":
      return { from: today, to: today };
    case "This week": {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
      return { from: toIsoDate(start), to: today };
    }
    case "This month":
      return { from: toIsoDate(new Date(y, m, 1)), to: today };
    case "Last month":
      return { from: toIsoDate(new Date(y, m - 1, 1)), to: toIsoDate(new Date(y, m, 0)) };
    case "This quarter":
      return { from: toIsoDate(new Date(y, Math.floor(m / 3) * 3, 1)), to: today };
    case "This year":
      return { from: toIsoDate(new Date(y, 0, 1)), to: today };
    default:
      return null;
  }
}

/** Which preset (if any) matches a range, so the dropdown reflects URL-restored dates. */
export function matchPreset(from: string, to: string): DatePreset {
  for (const preset of DATE_PRESETS) {
    const range = presetRange(preset);
    if (range && range.from === from && range.to === to) return preset;
  }
  return "Custom";
}

/* ---------------- export ---------------- */

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function buildCsv(result: ReportResult, rows: ReportRow[]) {
  // Raw numbers (no currency symbol) so the file works in spreadsheets.
  const raw = (row: ReportRow, column: ReportColumn) => {
    const value = row[column.key];
    if (value === null || value === undefined) return "";
    return String(value);
  };
  const lines = [
    result.columns.map((c) => csvCell(c.label)).join(","),
    ...rows.map((row) => result.columns.map((c) => csvCell(raw(row, c))).join(",")),
  ];
  if (result.totals) {
    lines.push(
      result.columns
        .map((c, i) => (i === 0 ? "Total" : result.totals && c.key in result.totals ? String(result.totals[c.key]) : ""))
        .map(csvCell)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function printReport(result: ReportResult, rows: ReportRow[], settings: Money, businessName?: string | null) {
  const fmt = (v: unknown, t: ReportValueType) => escapeHtml(formatReportValue(v, t, settings));
  const period = result.range
    ? `${formatReportDate(result.range.from, settings.dateFormat)} – ${formatReportDate(result.range.to, settings.dateFormat)}`
    : "As of today";
  const head = result.columns.map((c) => `<th class="${isNumericType(c.type) ? "num" : ""}">${escapeHtml(c.label)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr class="${row.emphasis ? "em" : ""}">${result.columns
          .map((c) => `<td class="${isNumericType(c.type) ? "num" : ""}">${fmt(row[c.key], c.type)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const totals = result.totals
    ? `<tr class="em">${result.columns
        .map((c, i) => `<td class="${isNumericType(c.type) ? "num" : ""}">${i === 0 ? "Total" : c.key in (result.totals || {}) ? fmt(result.totals?.[c.key], c.type) : ""}</td>`)
        .join("")}</tr>`
    : "";
  const summary = result.summary
    .map((s) => `<div class="card"><div class="label">${escapeHtml(s.label)}</div><div class="value">${fmt(s.value, s.type)}</div></div>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(result.title)}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#111;padding:24px}
      h1{margin:0;font-size:20px} .sub{color:#555;font-size:12px;margin:4px 0 16px}
      .cards{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
      .card{border:1px solid #ddd;border-radius:6px;padding:8px 12px;min-width:120px}
      .label{font-size:11px;color:#555}.value{font-size:15px;font-weight:bold}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left} th{background:#f5f5f5}
      .num{text-align:right;white-space:nowrap} tr.em td{font-weight:bold;background:#fafafa}
      .note{margin-top:12px;font-size:11px;color:#555}
      thead{display:table-header-group}
    </style></head><body>
    <h1>${escapeHtml(result.title)}</h1>
    <div class="sub">${escapeHtml(businessName || "")}${businessName ? " · " : ""}${escapeHtml(period)}</div>
    <div class="cards">${summary}</div>
    <table><thead><tr>${head}</tr></thead><tbody>${body}${totals}</tbody></table>
    ${result.note ? `<p class="note">${escapeHtml(result.note)}</p>` : ""}
    </body></html>`;

  const win = window.open("", "_blank", "width=1000,height=750");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
