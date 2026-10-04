"use client";

import { useState } from "react";
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReportActivity, getReportOverview } from "@/services/super-admin-api";
import { useLoader } from "./use-paged-list";
import { Card, ErrorState, FilterSelect, PageHeader, SA, SAButton, formatMoney, formatMoneyShort, timeAgo } from "./ui";

/*
 * Chart colours (validated with the dataviz palette checker, light surface):
 * - revenue is one series → one hue, the palette's green step (the brand green fails the chroma floor);
 * - the distribution uses the categorical order, max 6 slices (top 5 + "Other"); three slots are
 *   under 3:1 contrast, so every slice is also named with its value in the legend and table view.
 */
const REVENUE_COLOR = "#008300";
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const INK = "#1F2430";
const MUTED = "#6B7080";
const GRID = "#ECEDF0";

const RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "6m", label: "Last 6 Months" },
  { value: "12m", label: "Last 12 Months" },
];
const DISTRIBUTIONS = [
  { value: "company", label: "By Company" },
  { value: "role", label: "By Role" },
  { value: "category", label: "By Business Category" },
];
const ACTIVITY_RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const periodLabel = (period: string) => {
  const [y, m, d] = period.split("-");
  return d ? `${Number(d)} ${MONTHS[Number(m) - 1]}` : `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
};

const ACTIVITY_ICON: Record<string, string> = {
  company_registered: "domain_add",
  user_created: "person_add_alt",
  ticket_resolved: "task_alt",
  ticket_opened: "support_agent",
  payment_verified: "paid",
};

function Tile({ icon, bg, label, value, loading }: { icon: string; bg: string; label: string; value: string | number; loading: boolean }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: bg }}>
        <span aria-hidden className="material-icons text-[22px]">{icon}</span>
      </span>
      <div className="min-w-0">
        {loading ? <span className="block h-6 w-12 animate-pulse rounded bg-gray-100" /> : <p className="text-xl font-semibold" style={{ color: INK }}>{value}</p>}
        <p className="truncate text-xs" style={{ color: MUTED }}>{label}</p>
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-md" style={{ borderColor: SA.border }}>
      <p style={{ color: MUTED }}>{label ? periodLabel(label) : ""}</p>
      <p className="font-semibold" style={{ color: INK }}>{formatMoney(payload[0].value)}</p>
    </div>
  );
}

export function SuperAdminReportsScreen() {
  const [range, setRange] = useState("7d");
  const [distribution, setDistribution] = useState("company");
  const [activityRange, setActivityRange] = useState("today");
  const [tableView, setTableView] = useState(false);
  const overview = useLoader(() => getReportOverview(range, distribution), `${range}|${distribution}`, "Failed to load report");
  const activity = useLoader(() => getReportActivity(activityRange), activityRange, "Failed to load activity");
  const data = overview.data;
  const totalUsers = data?.distribution.reduce((sum, d) => sum + d.value, 0) ?? 0;
  const noRevenue = data ? data.series.every((p) => p.revenue === 0) : false;

  return (
    <>
      <PageHeader
        title="Report Dashboard"
        subtitle="Revenue, users and platform activity"
        actions={<SAButton variant="outline" icon="refresh" onClick={() => { overview.reload(); activity.reload(); }}>Refresh</SAButton>}
      />
      {overview.error && !data ? (
        <ErrorState message={overview.error} onRetry={() => overview.reload()} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile icon="apartment" bg="#5B7A5A" label="Total Companies" value={data?.totals.companies ?? 0} loading={!data} />
            <Tile icon="groups" bg="#29B6F6" label="Active User" value={data?.totals.active_users ?? 0} loading={!data} />
            <Tile icon="payments" bg="#EC407A" label="Monthly Revenue" value={formatMoneyShort(data?.totals.monthly_revenue ?? 0)} loading={!data} />
            <Tile icon="support_agent" bg="#5E35B1" label="Pending Support" value={data?.totals.pending_support ?? 0} loading={!data} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="p-4 xl:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium" style={{ color: INK }}>Revenue Overview</h2>
                <FilterSelect label="Revenue period" value={range} onChange={setRange} options={RANGES} />
              </div>
              <p className="mb-2 text-xs" style={{ color: MUTED }}>Verified payments, by payment date</p>
              <div className="h-[260px]" role="img" aria-label={`Revenue ${RANGES.find((r) => r.value === range)?.label}`}>
                {!data ? (
                  <div className="h-full animate-pulse rounded-lg bg-gray-50" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={GRID} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="period" tickFormatter={periodLabel} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis tickFormatter={(v: number) => formatMoneyShort(v).replace("Rs ", "")} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: MUTED, strokeWidth: 1, strokeDasharray: "3 3" }} />
                      <Line type="monotone" dataKey="revenue" stroke={REVENUE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              {noRevenue && <p className="mt-2 text-center text-xs" style={{ color: MUTED }}>No verified payments in this period yet.</p>}
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-medium" style={{ color: INK }}>User Distribution</h2>
                <FilterSelect label="Group users" value={distribution} onChange={setDistribution} options={DISTRIBUTIONS} />
              </div>
              {!data ? (
                <div className="h-[260px] animate-pulse rounded-lg bg-gray-50" />
              ) : data.distribution.length === 0 ? (
                <p className="py-16 text-center text-sm" style={{ color: MUTED }}>No users yet</p>
              ) : tableView ? (
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr style={{ color: MUTED }}><th className="py-1 font-medium">Group</th><th className="py-1 text-right font-medium">Users</th><th className="py-1 text-right font-medium">Share</th></tr>
                  </thead>
                  <tbody>
                    {data.distribution.map((d) => (
                      <tr key={d.label} className="border-t" style={{ borderColor: SA.border, color: INK }}>
                        <td className="py-1.5">{d.label}</td>
                        <td className="py-1.5 text-right">{d.value}</td>
                        <td className="py-1.5 text-right">{Math.round((d.value / totalUsers) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <>
                  <div className="relative h-[190px]" role="img" aria-label={`Users ${DISTRIBUTIONS.find((d) => d.value === distribution)?.label.toLowerCase()}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.distribution} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="92%" stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                          {data.distribution.map((d, i) => <Cell key={d.label} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} users (${Math.round((Number(value) / totalUsers) * 100)}%)`, String(name)]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-semibold" style={{ color: INK }}>{totalUsers}</span>
                      <span className="text-[11px]" style={{ color: MUTED }}>users</span>
                    </div>
                  </div>
                  <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                    {data.distribution.map((d, i) => (
                      <li key={d.label} className="flex items-center gap-2" style={{ color: INK }}>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{d.label}</span>
                        <span style={{ color: MUTED }}>{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {data && data.distribution.length > 0 && (
                <button type="button" onClick={() => setTableView((v) => !v)} className="mt-3 text-xs font-medium underline" style={{ color: "#588157" }}>
                  {tableView ? "Show chart" : "Show as table"}
                </button>
              )}
            </Card>
          </div>

          <Card className="mt-4 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-medium" style={{ color: INK }}>Recent activity</h2>
              <FilterSelect label="Activity period" value={activityRange} onChange={setActivityRange} options={ACTIVITY_RANGES} />
            </div>
            {activity.error ? (
              <ErrorState message={activity.error} onRetry={() => activity.reload()} />
            ) : !activity.data ? (
              <div className="h-24 animate-pulse rounded-lg bg-gray-50" />
            ) : activity.data.items.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: MUTED }}>Nothing happened in this period.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: SA.border }}>
                {activity.data.items.map((a, i) => (
                  <li key={`${a.type}-${a.at}-${i}`} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: "#5E35B1" }}>
                      <span aria-hidden className="material-icons text-[18px]">{ACTIVITY_ICON[a.type] ?? "bolt"}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium" style={{ color: INK }}>{a.title}</p>
                      <p className="truncate text-xs" style={{ color: MUTED }}>{a.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs" style={{ color: MUTED }}>{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}
