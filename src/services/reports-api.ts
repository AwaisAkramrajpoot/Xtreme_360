import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

/** date = range, day = single date, party/item/bankAccount/loanAccount = required selector. */
export type ReportFilter = "date" | "day" | "party" | "partyOptional" | "item" | "bankAccount" | "loanAccount";

export type ReportMeta = {
  key: string;
  title: string;
  description: string;
  filters: ReportFilter[];
};

export type ReportGroup = {
  key: string;
  title: string;
  icon: string;
  reports: ReportMeta[];
};

export type ReportValueType = "text" | "date" | "money" | "number" | "percent";

export type ReportColumn = { key: string; label: string; type: ReportValueType };

export type ReportRow = Record<string, string | number | boolean | null> & { emphasis?: boolean };

export type ReportResult = ReportMeta & {
  group: string;
  range: { from: string; to: string } | null;
  generated_at: string;
  summary: Array<{ label: string; value: number; type: ReportValueType }>;
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: Record<string, number> | null;
  note?: string;
};

export type ReportQuery = {
  from?: string;
  to?: string;
  partyId?: number | null;
  itemId?: number | null;
  accountId?: number | null;
};

let catalogCache: Promise<ReportGroup[]> | null = null;

/** Report catalog; cached for the session since it only changes with a deploy. */
export function getReportCatalog() {
  if (!catalogCache) {
    catalogCache = apiClient
      .get<ApiEnvelope<ReportGroup[]>>("/reports")
      .then((response) => unwrap(response) ?? [])
      .catch((error) => {
        catalogCache = null;
        throw error;
      });
  }
  return catalogCache;
}

export async function runReport(key: string, query: ReportQuery) {
  const response = await apiClient.get<ApiEnvelope<ReportResult>>(`/reports/${encodeURIComponent(key)}`, {
    params: {
      from: query.from || undefined,
      to: query.to || undefined,
      party_id: query.partyId || undefined,
      item_id: query.itemId || undefined,
      account_id: query.accountId || undefined,
    },
  });
  return unwrap(response);
}
