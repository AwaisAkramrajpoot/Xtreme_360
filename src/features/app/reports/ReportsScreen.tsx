"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { useAsyncData } from "@/hooks/use-async-data";
import { getReportCatalog, type ReportGroup } from "@/services/reports-api";
import { reportPath } from "./report-format";

export function ReportsScreen() {
  const { data: groups, loading, error, reload } = useAsyncData<ReportGroup[]>(getReportCatalog, [], "Failed to load reports");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        reports: g.reports.filter(
          (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || g.title.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.reports.length);
  }, [groups, search]);

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title="Reports"
        subtitle="Sales, purchases, stock, parties and accounts — generated from your live data"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reports"
      />

      {loading && (
        <div className="space-y-6" aria-busy="true">
          {[0, 1].map((g) => (
            <div key={g}>
              <div className="mb-3 h-5 w-40 animate-pulse rounded bg-[#E7E8EC]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-red-500">
          <p>{error}</p>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg px-4 py-2 font-semibold text-white"
            style={{ backgroundColor: AppColors.primary }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8 pb-10">
          {visible.map((group) => (
            <section key={group.key} aria-labelledby={`report-group-${group.key}`}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "#EAF2EA", color: AppColors.primary }}
                >
                  <span className="material-icons text-[18px]" aria-hidden>
                    {group.icon}
                  </span>
                </span>
                <h2 id={`report-group-${group.key}`} className="text-base font-bold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                  {group.title}
                </h2>
                <span className="text-xs" style={{ color: AppColors.grey }}>
                  {group.reports.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.reports.map((report) => (
                  <Link
                    key={report.key}
                    href={reportPath(report.key)}
                    className="group flex items-center gap-3 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(88,129,87,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]"
                    style={{ borderColor: AppColors.lightGrey }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                        {report.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug" style={{ color: AppColors.grey }}>
                        {report.description}
                      </span>
                    </span>
                    <span className="material-icons text-[22px] transition-transform group-hover:translate-x-0.5" style={{ color: AppColors.grey }} aria-hidden>
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {!visible.length && (
            <p className="py-16 text-center text-sm" style={{ color: AppColors.grey }}>
              No reports match &ldquo;{search.trim()}&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
