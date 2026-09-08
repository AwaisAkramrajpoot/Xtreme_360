export function isValidEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

export function isValidMobile(value: string): boolean {
  return /^\+?[0-9]{7,15}$/.test(value);
}

export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function formatDate(date: Date, format = "dd/MM/yyyy"): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  if (format === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (format === "mm/dd/yyyy") return `${month}/${day}/${year}`;
  return `${day}/${month}/${year}`;
}

/** Parse common display formats into a Date, or null if invalid. */
export function parseDisplayDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();

  // yyyy-MM-dd (native date input)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // dd/MM/yyyy or mm/dd/yyyy — assume dd/MM/yyyy for this app
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slash) {
    const date = new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function toNativeDateValue(value?: string | null): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function withCommas(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
