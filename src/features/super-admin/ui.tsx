"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import { AppColors } from "@/constants/colors";

/* Shared building blocks for the Super Admin panel (layout follows the panel mockups). */

export const SA = {
  pageBg: "#F6F7F9",
  border: "#E6E8EC",
  muted: "#7C8190",
  subtle: "#9AA0AE",
  text: "#1A1F2B",
  textSoft: "#4A5160",
  iconBox: "#F1F2F5",
  accentSoft: "#EEF4EE",
  shadow: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.03)",
} as const;

export function friendlyError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.trim()) return message;
  } else if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Date display follows Settings › General (date format + time zone). The shell loads the settings
 * and calls setDisplayPrefs; until then the defaults below apply.
 */
type DisplayPrefs = { dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"; timeZone: string };
let displayPrefs: DisplayPrefs = { dateFormat: "DD/MM/YYYY", timeZone: "Asia/Karachi" };
export const setDisplayPrefs = (prefs: DisplayPrefs) => {
  displayPrefs = prefs;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  let y: string, m: string, d: string;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    [, y, m, d] = dateOnly; // calendar dates are not shifted by time zone
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = new Intl.DateTimeFormat("en-CA", { timeZone: displayPrefs.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    } catch {
      parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    }
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    [y, m, d] = [get("year"), get("month"), get("day")];
  }
  if (displayPrefs.dateFormat === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  if (displayPrefs.dateFormat === "YYYY-MM-DD") return `${y}-${m}-${d}`;
  return `${d}/${m}/${y}`;
};

export const formatMoney = (value?: number | string | null) => {
  const n = Number(value || 0);
  return `Rs ${(Number.isFinite(n) ? n : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

/** Compact amount for tight tiles: Rs 12.4K, Rs 1.2M. */
export const formatMoneyShort = (value?: number | string | null) => {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1e6) return `Rs ${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 1e4) return `Rs ${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return formatMoney(n);
};

export const todayIso = () => new Date().toLocaleDateString("en-CA");

/** Removes one key from an error map (used when the field is edited). */
export const withoutError = (errors: Record<string, string>, key: string) => {
  if (!errors[key]) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
};

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: SA.text }}>
          {label}
        </p>
        {hint && (
          <p className="text-xs" style={{ color: SA.muted }}>
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
        style={{ backgroundColor: value ? AppColors.primary : "#D5D7DD" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: value ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

export function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: SA.text }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded"
        style={{ accentColor: AppColors.primary }}
      />
      {label}
    </label>
  );
}

export const timeAgo = (value?: string | null) => {
  if (!value) return "";
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [2592000, "month"],
    [31536000, "year"],
  ];
  let label = "";
  for (let i = units.length - 1; i >= 0; i -= 1) {
    const [size, name] = units[i];
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      label = `${n} ${name}${n === 1 ? "" : "s"} ago`;
      break;
    }
  }
  return label;
};

export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- layout pieces ---------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl" style={{ color: SA.text }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px]" style={{ color: SA.muted }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type ButtonVariant = "primary" | "outline" | "danger";

export function SAButton({
  children,
  icon,
  variant = "primary",
  onClick,
  disabled,
  loading,
  type = "button",
  className,
  title,
}: {
  children?: React.ReactNode;
  icon?: string;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const styles: Record<ButtonVariant, React.CSSProperties> = {
    primary: { backgroundColor: AppColors.primary, color: "#fff", borderColor: AppColors.primary },
    outline: { backgroundColor: "#fff", color: SA.text, borderColor: SA.border },
    danger: { backgroundColor: "#D14343", color: "#fff", borderColor: "#D14343" },
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 text-[13px] font-medium shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[opacity,background-color] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#588157] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      style={styles[variant]}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon && <span aria-hidden className="material-icons text-[18px]">{icon}</span>
      )}
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-xl border bg-white", className)} style={{ borderColor: SA.border, boxShadow: SA.shadow }}>
      {children}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  badge,
  badgeTone = "success",
  loading,
}: {
  icon: string;
  label: string;
  value: number | string;
  badge?: React.ReactNode;
  badgeTone?: "success" | "neutral" | "danger";
  loading?: boolean;
}) {
  const tone = {
    success: { bg: "#E8F5E9", color: "#2E7D32" },
    neutral: { bg: "transparent", color: SA.text },
    danger: { bg: "#FDECEC", color: "#C62828" },
  }[badgeTone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium" style={{ color: SA.muted }}>
          {label}
        </p>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: SA.accentSoft }}>
          <span aria-hidden className="material-icons text-[21px]" style={{ color: AppColors.primary }}>
            {icon}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {loading ? (
          <span className="h-8 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <span className="text-[28px] font-semibold leading-none tracking-tight" style={{ color: SA.text }}>
            {value}
          </span>
        )}
        {badge !== undefined && !loading && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: tone.bg, color: tone.color }}
          >
            {badge}
          </span>
        )}
      </div>
    </Card>
  );
}

export function Panel({
  title,
  icon,
  iconColor,
  badge,
  action,
  children,
  className,
}: {
  title: string;
  icon?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={clsx("flex flex-col p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span aria-hidden className="material-icons text-[20px]" style={{ color: iconColor || AppColors.primary }}>
              {icon}
            </span>
          )}
          <h2 className="truncate text-[15px] font-semibold" style={{ color: SA.text }}>
            {title}
          </h2>
          {badge}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export type Tone = "success" | "info" | "warning" | "danger" | "neutral";

const TONES: Record<Tone, { bg: string; color: string }> = {
  success: { bg: "#E8F5E9", color: "#2E7D32" },
  info: { bg: "#E0F2FE", color: "#0277BD" },
  warning: { bg: "#FFF3E0", color: "#E65100" },
  danger: { bg: "#FCE4EC", color: "#C2185B" },
  neutral: { bg: "#F1F2F5", color: "#5B6170" },
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: t.bg, color: t.color }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="material-icons text-[64px]" style={{ color: "#C9CBD3" }} aria-hidden>
        warning_amber
      </span>
      <p className="mt-2 text-base font-medium" style={{ color: "#B5B8C2" }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 max-w-sm text-sm" style={{ color: SA.muted }}>
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
      <span className="material-icons text-[48px] text-red-300" aria-hidden>
        error_outline
      </span>
      <p className="mt-2 max-w-md text-sm text-red-600">{message}</p>
      {onRetry && (
        <SAButton variant="outline" icon="refresh" onClick={onRetry} className="mt-4">
          Try again
        </SAButton>
      )}
    </div>
  );
}

/* ---------------- table ---------------- */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-[13px]">
        <thead>
          <tr style={{ backgroundColor: "#F7F8FA" }}>
            {columns.map((c, i) => (
              <th
                key={c.key}
                scope="col"
                className={clsx(
                  "whitespace-nowrap border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wider",
                  i === 0 && "rounded-tl-lg",
                  i === columns.length - 1 && "rounded-tr-lg",
                  c.className
                )}
                style={{ color: SA.muted, borderColor: SA.border }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={c.key} className="border-b px-4 py-4" style={{ borderColor: SA.border }}>
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-[#F9FAFB]">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx("border-b px-4 py-3.5 align-middle", c.className)}
                      style={{ borderColor: SA.border, color: SA.text }}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  if (total <= 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-2 text-sm sm:flex-row" style={{ color: SA.muted }}>
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-gray-50 disabled:opacity-40"
          style={{ borderColor: SA.border }}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <span aria-hidden className="material-icons text-[18px]">chevron_left</span>
        </button>
        <span className="px-2" style={{ color: SA.text }}>
          {page} / {pages}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-colors hover:bg-gray-50 disabled:opacity-40"
          style={{ borderColor: SA.border }}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <span aria-hidden className="material-icons text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function RowAction({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
      style={{ color }}
    >
      <span aria-hidden className="material-icons text-[19px]">{icon}</span>
    </button>
  );
}

/* ---------------- filters & forms ---------------- */

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 transition-colors focus-within:border-[#588157] sm:w-72" style={{ borderColor: SA.border }}>
      <span className="material-icons text-[18px]" style={{ color: SA.muted }} aria-hidden>
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-[#9AA0AE]"
      />
    </label>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border bg-white px-3 text-[13px] outline-none focus:border-[#588157]"
      style={{ borderColor: SA.border, color: SA.text }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FieldLabel({ icon, children, required }: { icon?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: SA.text }}>
      {icon && (
        <span className="material-icons text-[17px]" aria-hidden>
          {icon}
        </span>
      )}
      {children}
      {required && <span className="text-red-500">*</span>}
    </span>
  );
}

export function TextInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = "text",
  multiline,
  autoComplete,
  readOnly,
}: {
  label: string;
  icon?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  readOnly?: boolean;
}) {
  const common = {
    value,
    placeholder,
    readOnly,
    "aria-invalid": error ? true : undefined,
    className: "w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#588157] focus:bg-white focus:ring-3 focus:ring-[#588157]/10",
    style: { backgroundColor: readOnly ? "#EEF0F3" : "#F8F9FB", borderColor: error ? "#E57373" : SA.border, color: readOnly ? SA.muted : SA.text },
  };
  return (
    <label className="block">
      <FieldLabel icon={icon} required={required}>
        {label}
      </FieldLabel>
      {multiline ? (
        <textarea {...common} rows={3} className={clsx(common.className, "py-2.5")} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...common}
          type={type}
          autoComplete={autoComplete}
          className={clsx(common.className, "h-11")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#588157] focus:ring-3 focus:ring-[#588157]/10"
        style={{ backgroundColor: "#F8F9FB", borderColor: error ? "#E57373" : SA.border, color: value ? SA.text : SA.muted }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/** Upload button with preview and a remove (×) control, as in the Business Profile mockup. */
export function LogoUpload({
  label,
  file,
  existingUrl,
  onFile,
  onRemoveExisting,
  error,
}: {
  label: string;
  file: File | null;
  existingUrl?: string | null;
  onFile: (file: File | null) => void;
  onRemoveExisting?: () => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview || existingUrl || null;

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (next && next.size > MAX_LOGO_BYTES) {
            setLocalError("Logo must be 5 MB or smaller");
            return;
          }
          setLocalError("");
          onFile(next);
        }}
      />
      {shown ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt={`${label} preview`} className="h-14 w-24 rounded-md border object-contain" style={{ borderColor: SA.border }} />
          <button
            type="button"
            aria-label="Remove logo"
            onClick={() => (file ? onFile(null) : onRemoveExisting?.())}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500 shadow"
          >
            <span aria-hidden className="material-icons text-[14px]">close</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-md border"
            style={{ borderColor: SA.border }}
            aria-label={`Upload ${label.toLowerCase()}`}
          >
            <span aria-hidden className="material-icons text-[18px]" style={{ color: SA.muted }}>
              file_upload
            </span>
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: SA.border, color: SA.text }}
          >
            Upload Logo
          </button>
        </div>
      )}
      {(localError || error) && <span className="mt-1 block text-xs text-red-500">{localError || error}</span>}
    </div>
  );
}

export function ModalFooter({
  onReset,
  onSave,
  saving,
  saveLabel = "Save",
  resetLabel = "Reset",
}: {
  onReset: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  resetLabel?: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <button
        type="button"
        onClick={onReset}
        className="col-span-2 h-11 rounded-md border bg-white text-sm font-medium"
        style={{ borderColor: SA.border, color: SA.text }}
      >
        {resetLabel}
      </button>
      <SAButton onClick={onSave} loading={saving} className="col-span-3 h-11">
        {saveLabel}
      </SAButton>
    </div>
  );
}
