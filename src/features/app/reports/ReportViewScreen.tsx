"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppColors } from "@/constants/colors";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { getParties } from "@/services/party-api";
import { getItems } from "@/services/item-api";
import { getAccounts } from "@/services/cash-bank-api";
import {
  getReportCatalog,
  runReport,
  type ReportFilter,
  type ReportGroup,
  type ReportResult,
  type ReportRow,
} from "@/services/reports-api";
import { useSettingsStore } from "@/stores/settings-store";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import {
  DATE_PRESETS,
  REPORTS_ROUTE,
  buildCsv,
  downloadCsv,
  formatReportDate,
  formatReportValue,
  isNumericType,
  matchPreset,
  presetRange,
  printReport,
  toIsoDate,
  type DatePreset,
} from "./report-format";

type Option = { id: number; name: string };
const optionKey = (o: Option) => `${o.id}::${o.name}`;
const optionLabel = (key: string) => key.split("::").slice(1).join("::");

const inputClass =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/20";

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: AppColors.grey }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function OptionPicker({
  label,
  options,
  value,
  onChange,
  loading,
  allowAll,
  emptyHint,
}: {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (id: number | null) => void;
  loading: boolean;
  allowAll?: boolean;
  emptyHint: string;
}) {
  const ALL = "0::All";
  const items = [...(allowAll ? [ALL] : []), ...options.map(optionKey)];
  const selected = options.find((o) => o.id === value);
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: AppColors.grey }}>
        {label}
      </span>
      {loading ? (
        <div className="h-11 animate-pulse rounded-lg bg-[#ECEDEF]" />
      ) : options.length ? (
        <AppDropDown
          items={items}
          value={selected ? optionKey(selected) : allowAll ? ALL : null}
          onChange={(key) => onChange(Number(key.split("::")[0]) || null)}
          hintText={`Select ${label.toLowerCase()}`}
          getLabel={optionLabel}
        />
      ) : (
        <p className="flex h-11 items-center rounded-lg border px-3 text-sm" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
          {emptyHint}
        </p>
      )}
    </div>
  );
}

function ReportView({ reportKey }: { reportKey: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const general = useSettingsStore((s) => s.app.general);
  const businessName = useSessionProfileStore((s) => s.business?.name);
  const { showToast, Toast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const catalog = useAsyncData<ReportGroup[]>(getReportCatalog, [], "Failed to load reports");
  const meta = catalog.data.flatMap((g) => g.reports).find((r) => r.key === reportKey);
  const has = useCallback((f: ReportFilter) => Boolean(meta?.filters.includes(f)), [meta]);

  /* ---- filters live in the URL, so refresh / share / back keep the same report ---- */
  const monthRange = presetRange("This month")!;
  const today = toIsoDate(new Date());
  const from = params.get("from") || (has("day") ? today : monthRange.from);
  const to = has("day") ? from : params.get("to") || monthRange.to;
  const partyId = Number(params.get("party")) || null;
  const itemId = Number(params.get("item")) || null;
  const accountId = Number(params.get("account")) || null;
  const [customRange, setCustomRange] = useState(false);
  const preset: DatePreset = customRange ? "Custom" : matchPreset(from, to);

  const setParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  /* ---- lookups for selectors ---- */
  const needsParty = has("party") || has("partyOptional");
  const needsItem = has("item");
  const accountType = has("bankAccount") ? "bank" : has("loanAccount") ? "loan" : null;

  const partyLoader = useCallback(
    async (): Promise<Option[]> => (needsParty ? (await getParties()).map((p) => ({ id: p.id, name: p.party_name })) : []),
    [needsParty]
  );
  const itemLoader = useCallback(
    async (): Promise<Option[]> =>
      needsItem ? (await getItems()).filter((i) => (i.item_type ?? "product") === "product").map((i) => ({ id: i.id, name: i.item_name })) : [],
    [needsItem]
  );
  const accountLoader = useCallback(
    async (): Promise<Option[]> => (accountType ? (await getAccounts(accountType)).map((a) => ({ id: a.id, name: a.account_name })) : []),
    [accountType]
  );
  const parties = useAsyncData(partyLoader, [] as Option[]);
  const items = useAsyncData(itemLoader, [] as Option[]);
  const accounts = useAsyncData(accountLoader, [] as Option[]);

  const missing =
    has("party") && !partyId
      ? "Select a party to view this report."
      : has("item") && !itemId
        ? "Select an item to view this report."
        : accountType && !accountId
          ? `Select a ${accountType === "loan" ? "loan" : "bank"} account to view this report.`
          : null;

  /* ---- run the report whenever its inputs change ---- */
  const usesDates = has("date") || has("day");
  const reportLoader = useCallback(async () => {
    if (!meta || missing) return null;
    return (
      (await runReport(reportKey, {
        from: usesDates ? from : undefined,
        to: usesDates ? to : undefined,
        partyId,
        itemId,
        accountId,
      })) ?? null
    );
  }, [meta, missing, reportKey, usesDates, from, to, partyId, itemId, accountId]);
  const report = useAsyncData<ReportResult | null>(reportLoader, null, "Failed to generate report");
  const result = report.data;

  /* ---- search + sort ---- */
  const sortable = Boolean(
    result && !result.rows.some((r) => r.emphasis) && !result.columns.some((c) => c.key === "balance" || c.key === "running")
  );
  const rows = useMemo(() => {
    if (!result) return [] as ReportRow[];
    const q = search.trim().toLowerCase();
    let out = q
      ? result.rows.filter((row) => result.columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)))
      : result.rows;
    if (sort && sortable) {
      const column = result.columns.find((c) => c.key === sort.key);
      const numeric = column ? isNumericType(column.type) : false;
      out = [...out].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const cmp = numeric ? Number(av || 0) - Number(bv || 0) : String(av ?? "").localeCompare(String(bv ?? ""));
        return cmp * sort.dir;
      });
    }
    return out;
  }, [result, search, sort, sortable]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  const exportCsv = () => {
    if (!result) return;
    const suffix = result.range ? `_${result.range.from}_${result.range.to}` : `_${today}`;
    downloadCsv(`${result.key}${suffix}.csv`, buildCsv(result, rows));
    showToast("CSV downloaded");
  };

  const print = () => {
    if (!result) return;
    if (!printReport(result, rows, general, businessName)) showToast("Allow pop-ups to print", "error");
  };

  /* ---- render ---- */
  if (!catalog.loading && !catalog.error && !meta) {
    return (
      <div className="flex min-h-full flex-col">
        <AppAppBar title="Report not found" showBack backHref={REPORTS_ROUTE} />
        <div className="flex flex-col items-center gap-3 py-16 text-sm" style={{ color: AppColors.grey }}>
          <p>This report doesn&apos;t exist.</p>
          <Link href={REPORTS_ROUTE} className="font-semibold" style={{ color: AppColors.primary }}>
            Browse all reports
          </Link>
        </div>
      </div>
    );
  }

  const actionButton = "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-sm font-semibold text-[#1F2937] transition-colors hover:bg-[#F3F4F6] disabled:opacity-50";

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title={meta?.title ?? "Report"}
        subtitle={meta?.description}
        showBack
        backHref={REPORTS_ROUTE}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rows"
        actions={
          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" className={actionButton} style={{ borderColor: AppColors.lightGrey }} onClick={exportCsv} disabled={!result?.rows.length}>
              <span className="material-icons text-[18px]" aria-hidden>download</span>
              CSV
            </button>
            <button type="button" className={actionButton} style={{ borderColor: AppColors.lightGrey }} onClick={print} disabled={!result}>
              <span className="material-icons text-[18px]" aria-hidden>print</span>
              Print
            </button>
          </div>
        }
      />

      {/* Filters */}
      {meta && meta.filters.length > 0 && (
        <section className="mb-4 rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {has("date") && (
              <>
                <FilterField label="Period">
                  <select
                    className={inputClass}
                    style={{ borderColor: AppColors.lightGrey }}
                    value={preset}
                    onChange={(e) => {
                      const next = e.target.value as DatePreset;
                      if (next === "Custom") return setCustomRange(true);
                      setCustomRange(false);
                      const range = presetRange(next);
                      if (range) setParams({ from: range.from, to: range.to });
                    }}
                  >
                    {DATE_PRESETS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="From">
                  <input type="date" className={inputClass} style={{ borderColor: AppColors.lightGrey }} value={from} max={to}
                    onChange={(e) => { setCustomRange(true); if (e.target.value) setParams({ from: e.target.value }); }} />
                </FilterField>
                <FilterField label="To">
                  <input type="date" className={inputClass} style={{ borderColor: AppColors.lightGrey }} value={to} min={from}
                    onChange={(e) => { setCustomRange(true); if (e.target.value) setParams({ to: e.target.value }); }} />
                </FilterField>
              </>
            )}
            {has("day") && (
              <FilterField label="Date">
                <input type="date" className={inputClass} style={{ borderColor: AppColors.lightGrey }} value={from}
                  onChange={(e) => e.target.value && setParams({ from: e.target.value, to: null })} />
              </FilterField>
            )}
            {needsParty && (
              <OptionPicker label="Party" options={parties.data} value={partyId} loading={parties.loading}
                allowAll={has("partyOptional")} emptyHint="No parties yet" onChange={(id) => setParams({ party: id })} />
            )}
            {needsItem && (
              <OptionPicker label="Item" options={items.data} value={itemId} loading={items.loading}
                emptyHint="No products yet" onChange={(id) => setParams({ item: id })} />
            )}
            {accountType && (
              <OptionPicker label={accountType === "loan" ? "Loan account" : "Bank account"} options={accounts.data} value={accountId}
                loading={accounts.loading} emptyHint={accountType === "loan" ? "No loan accounts yet" : "No bank accounts yet"}
                onChange={(id) => setParams({ account: id })} />
            )}
          </div>
        </section>
      )}

      {/* States */}
      {(catalog.error || report.error) && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#F2C2C2", backgroundColor: "#FDF1F1", color: "#8A2B2B" }}>
          <span>{catalog.error || report.error}</span>
          <button type="button" onClick={catalog.error ? catalog.reload : report.reload}
            className="rounded-lg px-3 py-1.5 font-semibold text-white" style={{ backgroundColor: AppColors.primary }}>
            Retry
          </button>
        </div>
      )}

      {meta && missing && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-white px-4 py-14 text-center" style={{ borderColor: AppColors.lightGrey }}>
          <span className="material-icons text-4xl" style={{ color: AppColors.lightGrey }} aria-hidden>filter_alt</span>
          <p className="text-sm" style={{ color: AppColors.grey }}>{missing}</p>
        </div>
      )}

      {(catalog.loading || (!missing && report.loading && !result)) && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading report">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-white" />
        </div>
      )}

      {result && !missing && (
        <div className={`space-y-4 pb-10 transition-opacity ${report.loading ? "opacity-60" : ""}`}>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {result.summary.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
                <p className="truncate text-xs font-medium" style={{ color: AppColors.grey }}>{s.label}</p>
                <p className="mt-1 truncate text-lg font-bold tabular-nums text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                  {formatReportValue(s.value, s.type, general)}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile actions */}
          <div className="flex gap-2 sm:hidden">
            <button type="button" className={`${actionButton} flex-1 justify-center`} style={{ borderColor: AppColors.lightGrey }} onClick={exportCsv} disabled={!result.rows.length}>
              <span className="material-icons text-[18px]" aria-hidden>download</span> CSV
            </button>
            <button type="button" className={`${actionButton} flex-1 justify-center`} style={{ borderColor: AppColors.lightGrey }} onClick={print}>
              <span className="material-icons text-[18px]" aria-hidden>print</span> Print
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: AppColors.lightGrey }}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-xs" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
              <span>
                {result.range
                  ? `${formatReportDate(result.range.from, general.dateFormat)} – ${formatReportDate(result.range.to, general.dateFormat)}`
                  : "As of today"}
                {" · "}
                {rows.length} {rows.length === 1 ? "row" : "rows"}
                {search.trim() && result.rows.length !== rows.length ? ` of ${result.rows.length}` : ""}
              </span>
              <button type="button" onClick={report.reload} className="inline-flex items-center gap-1 font-semibold" style={{ color: AppColors.primary }}>
                <span className="material-icons text-[16px]" aria-hidden>refresh</span>
                Refresh
              </button>
            </div>

            {rows.length ? (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F8F9FA]">
                    <tr>
                      {result.columns.map((c) => {
                        const numeric = isNumericType(c.type);
                        const active = sort?.key === c.key;
                        return (
                          <th key={c.key} scope="col"
                            aria-sort={active ? (sort?.dir === 1 ? "ascending" : "descending") : undefined}
                            className={`whitespace-nowrap border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${numeric ? "text-right" : "text-left"}`}
                            style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
                            {sortable ? (
                              <button type="button" onClick={() => toggleSort(c.key)}
                                className={`inline-flex items-center gap-0.5 uppercase hover:text-black ${numeric ? "flex-row-reverse" : ""}`}>
                                {c.label}
                                <span className="material-icons text-[14px]" aria-hidden style={{ opacity: active ? 1 : 0.3 }}>
                                  {active && sort?.dir === -1 ? "arrow_downward" : "arrow_upward"}
                                </span>
                              </button>
                            ) : (
                              c.label
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-b last:border-b-0 ${row.emphasis ? "bg-[#F7FAF7] font-semibold" : "hover:bg-[#FAFBFA]"}`}
                        style={{ borderColor: "#F0F0F0" }}>
                        {result.columns.map((c) => {
                          const value = row[c.key];
                          const negative = c.type === "money" && Number(value) < 0;
                          return (
                            <td key={c.key}
                              className={`px-4 py-2.5 ${isNumericType(c.type) ? "whitespace-nowrap text-right tabular-nums" : ""}`}
                              style={{ color: negative ? AppColors.redText : AppColors.black }}>
                              {formatReportValue(value, c.type, general)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  {result.totals && !search.trim() && (
                    <tfoot className="sticky bottom-0 bg-[#F3F6F3]">
                      <tr>
                        {result.columns.map((c, i) => (
                          <td key={c.key}
                            className={`border-t px-4 py-2.5 font-bold ${isNumericType(c.type) ? "whitespace-nowrap text-right tabular-nums" : ""}`}
                            style={{ borderColor: AppColors.lightGrey }}>
                            {i === 0 ? "Total" : result.totals && c.key in result.totals ? formatReportValue(result.totals[c.key], c.type, general) : ""}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <p className="px-4 py-14 text-center text-sm" style={{ color: AppColors.grey }}>
                {search.trim() ? `No rows match “${search.trim()}”.` : "No data for the selected filters."}
              </p>
            )}
          </div>

          {result.note && (
            <p className="flex items-start gap-1.5 text-xs" style={{ color: AppColors.grey }}>
              <span className="material-icons text-[16px]" aria-hidden>info</span>
              {result.note}
            </p>
          )}
        </div>
      )}
      {Toast}
    </div>
  );
}

export function ReportViewScreen({ reportKey }: { reportKey: string }) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-white" />}>
      <ReportView reportKey={reportKey} />
    </Suspense>
  );
}
