"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AppColors } from "@/constants/colors";

const data = [
  { day: "Mon", thisWeek: 2600, lastWeek: 3600 },
  { day: "Tue", thisWeek: 3100, lastWeek: 2800 },
  { day: "Wed", thisWeek: 4000, lastWeek: 2100 },
  { day: "Thu", thisWeek: 3400, lastWeek: 3800 },
  { day: "Fri", thisWeek: 5000, lastWeek: 4500 },
  { day: "Sat", thisWeek: 3000, lastWeek: 3800 },
  { day: "Sun", thisWeek: 2600, lastWeek: 5000 },
];

export function SaleVsPurchaseGraph() {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 mb-1">
        <h2 className="text-lg font-bold text-black flex-1" style={{ fontFamily: "var(--font-poppins)" }}>
          Sale Vs Purchases
        </h2>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AppColors.primary }} />
        <span className="text-xs">This Week</span>
        <span className="w-2 h-2 rounded-full bg-black/50 ml-1" />
        <span className="text-xs">Last Week</span>
      </div>
      <p className="text-xs mb-6" style={{ color: AppColors.grey }}>Monthly Comparison For Last 6 Months</p>
      <div className="w-full min-h-[220px]" style={{ aspectRatio: "1.7 / 1" }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E7E8EC" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#68737D" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#67727D" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.[1] ? (
                  <div className="bg-black text-white text-xs font-bold px-3 py-2 rounded-lg">
                    ${payload[1].value}
                  </div>
                ) : null
              }
            />
            <ReferenceLine x="Wed" stroke={`${AppColors.primary}4D`} strokeWidth={40} />
            <Line type="monotone" dataKey="lastWeek" stroke="rgba(0,0,0,0.54)" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="thisWeek"
              stroke={AppColors.primary}
              strokeWidth={2}
              dot={{ r: 4, fill: AppColors.black, stroke: AppColors.white, strokeWidth: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
