import { createParty, getParties } from "@/services/party-api";
import { createItem, getItems } from "@/services/item-api";
import { createExpense, getExpenses } from "@/services/expense-api";

export type ImportFieldType = "text" | "number" | "date" | "enum";

export type ImportField = {
  key: string;
  label: string;
  type: ImportFieldType;
  required?: boolean;
  /** Header names (case/space-insensitive) that map to this field. */
  aliases: string[];
  options?: string[];
  example: string;
};

export type ParsedRow = Record<string, string>;

export type ImportConfig = {
  kind: "parties" | "items" | "expenses";
  title: string;
  entityLabel: string;
  description: string;
  fields: ImportField[];
  /** Field used to detect rows that already exist. */
  uniqueKey?: string;
  loadExistingKeys?: () => Promise<Set<string>>;
  create: (row: ParsedRow) => Promise<unknown>;
};

/* ---------------- CSV ---------------- */

/** RFC 4180 CSV parser: quoted fields, escaped quotes, commas/newlines inside quotes, BOM. */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Maps each CSV column index to a field key (or null when unrecognised). */
export function mapHeaders(headers: string[], fields: ImportField[]) {
  return headers.map((header) => {
    const h = normalizeHeader(header);
    const field = fields.find((f) => [f.key, f.label, ...f.aliases].some((a) => normalizeHeader(a) === h));
    return field ? field.key : null;
  });
}

/** Accepts YYYY-MM-DD, DD/MM/YYYY and DD-MM-YYYY; returns YYYY-MM-DD or null. */
export function normalizeDate(value: string): string | null {
  const v = value.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(v))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Validates and normalises one row; returns the cleaned row and any errors. */
export function validateRow(raw: ParsedRow, fields: ImportField[]) {
  const row: ParsedRow = {};
  const errors: string[] = [];
  for (const f of fields) {
    const value = (raw[f.key] ?? "").trim();
    if (!value) {
      if (f.required) errors.push(`${f.label} is required`);
      continue;
    }
    if (f.type === "number") {
      const num = Number(value.replace(/,/g, ""));
      if (!Number.isFinite(num)) errors.push(`${f.label} must be a number`);
      else row[f.key] = String(num);
    } else if (f.type === "date") {
      const iso = normalizeDate(value);
      if (!iso) errors.push(`${f.label} must be a date (YYYY-MM-DD or DD/MM/YYYY)`);
      else row[f.key] = iso;
    } else if (f.type === "enum") {
      const option = f.options?.find((o) => o.toLowerCase() === value.toLowerCase());
      if (!option) errors.push(`${f.label} must be one of: ${f.options?.join(", ")}`);
      else row[f.key] = option;
    } else {
      row[f.key] = value;
    }
  }
  return { row, errors };
}

export function templateCsv(config: ImportConfig) {
  const header = config.fields.map((f) => f.label).join(",");
  const example = config.fields.map((f) => (f.example.includes(",") ? `"${f.example}"` : f.example)).join(",");
  return `${header}\r\n${example}\r\n`;
}

/* ---------------- configs ---------------- */

const lower = (v: string) => v.trim().toLowerCase();

const PARTIES: ImportConfig = {
  kind: "parties",
  title: "Import Parties",
  entityLabel: "parties",
  description: "Add customers and suppliers in bulk.",
  uniqueKey: "partyName",
  loadExistingKeys: async () => new Set((await getParties()).map((p) => lower(p.party_name))),
  fields: [
    { key: "partyName", label: "Party Name", type: "text", required: true, aliases: ["name", "party", "customer name", "supplier name"], example: "Ali Traders" },
    { key: "mobileNumber", label: "Mobile Number", type: "text", aliases: ["mobile", "phone", "phone number", "contact"], example: "03001234567" },
    { key: "partyType", label: "Party Type", type: "enum", options: ["Customer", "Supplier", "Both"], aliases: ["type"], example: "Customer" },
    { key: "partyCategory", label: "Category", type: "text", aliases: ["party category", "group"], example: "Retail" },
    { key: "openingBalance", label: "Opening Balance", type: "number", aliases: ["balance", "opening"], example: "0" },
    { key: "address", label: "Address", type: "text", aliases: ["billing address"], example: "Main Market, Lahore" },
    { key: "city", label: "City", type: "text", aliases: [], example: "Lahore" },
    { key: "country", label: "Country", type: "text", aliases: [], example: "Pakistan" },
    { key: "tinNumber", label: "NTN Number", type: "text", aliases: ["tin", "ntn", "gstin", "tax number"], example: "" },
  ],
  create: (r) =>
    createParty({
      partyName: r.partyName,
      mobileNumber: r.mobileNumber,
      partyType: r.partyType,
      partyCategory: r.partyCategory,
      openingBalance: r.openingBalance,
      address: r.address,
      city: r.city,
      country: r.country,
      tinNumber: r.tinNumber,
      isActive: true,
    }),
};

const itemFields = (extraAliases: Record<string, string[]> = {}): ImportField[] => [
  { key: "itemName", label: "Item Name", type: "text", required: true, aliases: ["name", "item", "product name", ...(extraAliases.itemName || [])], example: "Basmati Rice 5kg" },
  { key: "itemType", label: "Item Type", type: "enum", options: ["product", "service"], aliases: ["type"], example: "product" },
  { key: "itemCode", label: "Item Code", type: "text", aliases: ["code", "sku", "barcode", ...(extraAliases.itemCode || [])], example: "RICE-5" },
  { key: "itemCategory", label: "Category", type: "text", aliases: ["item category"], example: "Grocery" },
  { key: "itemUnit", label: "Unit", type: "text", aliases: ["uom", "unit of measure"], example: "Bag" },
  { key: "salePrice", label: "Sale Price", type: "number", aliases: ["price", "selling price", "sales price", "mrp", ...(extraAliases.salePrice || [])], example: "1500" },
  { key: "purchasePrice", label: "Purchase Price", type: "number", aliases: ["cost", "cost price", "buying price"], example: "1200" },
  { key: "openingStock", label: "Opening Stock", type: "number", aliases: ["stock", "quantity", "qty", "current stock", "stock quantity"], example: "25" },
  { key: "minStockQty", label: "Min Stock", type: "number", aliases: ["minimum stock", "low stock", "reorder level"], example: "5" },
  { key: "description", label: "Description", type: "text", aliases: ["details"], example: "" },
];

const createItemRow = (r: ParsedRow) =>
  createItem({
    itemName: r.itemName,
    itemType: r.itemType || "product",
    itemCode: r.itemCode,
    itemCategory: r.itemCategory,
    itemUnit: r.itemUnit,
    salePrice: r.salePrice,
    purchasePrice: r.purchasePrice,
    openingStock: r.openingStock,
    minStockQty: r.minStockQty,
    description: r.description,
  });

const loadItemNames = async () => new Set((await getItems()).map((i) => lower(i.item_name)));

const ITEMS: ImportConfig = {
  kind: "items",
  title: "Import Items",
  entityLabel: "items",
  description: "Add products and services in bulk.",
  uniqueKey: "itemName",
  loadExistingKeys: loadItemNames,
  fields: itemFields(),
  create: createItemRow,
};

const BILLBOOK: ImportConfig = {
  ...ITEMS,
  title: "Import from Billbook",
  description: "Export your item list from Billbook as CSV, then upload it here. Common Billbook column names are recognised automatically.",
  fields: itemFields({ itemName: ["item name", "product"], itemCode: ["hsn", "hsn code", "sac"], salePrice: ["sales price", "sale price with tax"] }),
};

const EXPENSES: ImportConfig = {
  kind: "expenses",
  title: "Import Expenses",
  entityLabel: "expenses",
  description: "Add past expenses in bulk.",
  loadExistingKeys: async () => new Set((await getExpenses()).map((e) => lower(e.expense_no || ""))),
  uniqueKey: "expenseNo",
  fields: [
    { key: "date", label: "Date", type: "date", required: true, aliases: ["expense date"], example: "2026-09-01" },
    { key: "category", label: "Category", type: "text", required: true, aliases: ["expense category", "head"], example: "Rent" },
    { key: "totalAmount", label: "Amount", type: "number", required: true, aliases: ["total", "total amount"], example: "25000" },
    { key: "expenseNo", label: "Expense No", type: "text", aliases: ["number", "reference", "ref"], example: "" },
    { key: "notes", label: "Notes", type: "text", aliases: ["description", "remarks"], example: "September shop rent" },
  ],
  create: (r) =>
    createExpense({ date: r.date, category: r.category, totalAmount: r.totalAmount, expenseNo: r.expenseNo, notes: r.notes }),
};

export const IMPORT_CONFIGS = { parties: PARTIES, items: ITEMS, billbook: BILLBOOK, expenses: EXPENSES };
export type ImportKind = keyof typeof IMPORT_CONFIGS;
