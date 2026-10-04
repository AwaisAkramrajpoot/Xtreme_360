"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppColors } from "@/constants/colors";
import type { DashboardSummary } from "@/services/dashboard-api";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleString(undefined, { month: "short" });
}

function compact(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function SaleVsPurchaseGraph({
  monthly,
  money,
}: {
  monthly: DashboardSummary["monthly"];
  money: (value: number) => string;
}) {
  const data = monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const empty = data.every((d) => !d.sales && !d.purchases);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 mb-1">
        <h2 className="text-lg font-bold text-black flex-1" style={{ fontFamily: "var(--font-poppins)" }}>
          Sale Vs Purchases
        </h2>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AppColors.primary }} />
        <span className="text-xs">Sales</span>
        <span className="w-2 h-2 rounded-full bg-black/50 ml-2" />
        <span className="text-xs">Purchases</span>
      </div>
      <p className="text-xs mb-6" style={{ color: AppColors.grey }}>Monthly comparison for the last 6 months</p>
      <div className="relative w-full h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E7E8EC" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#68737D" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#67727D" }} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg bg-black px-3 py-2 text-xs text-white">
                    <p className="mb-1 font-bold">{label}</p>
                    {payload.map((p) => (
                      <p key={String(p.dataKey)}>
                        {p.dataKey === "sales" ? "Sales" : "Purchases"}: {money(Number(p.value || 0))}
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Line type="monotone" dataKey="purchases" stroke="rgba(0,0,0,0.54)" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke={AppColors.primary}
              strokeWidth={2}
              dot={{ r: 4, fill: AppColors.black, stroke: AppColors.white, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm" style={{ color: AppColors.grey }}>
            No sales or purchases in the last 6 months
          </p>
        )}
      </div>
    </div>
  );
}
