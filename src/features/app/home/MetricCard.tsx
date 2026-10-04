import { AppColors } from "@/constants/colors";
import { AppAsset } from "@/components/ui/AppAsset";
import type { DashboardMetric } from "./home-dashboard-data";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const trendColor =
    metric.isPositive === null ? AppColors.grey : metric.isPositive ? AppColors.greenText : AppColors.redText;

  return (
    <div
      className="p-3 sm:p-4 bg-white rounded-xl flex flex-col h-full min-w-0"
      style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
    >
      <div className="flex justify-between items-start gap-2 min-w-0">
        <span
          className="text-xs sm:text-sm flex-1 truncate"
          style={{ color: AppColors.greyishBlack, fontFamily: "var(--font-poppins)" }}
        >
          {metric.title}
        </span>
        <AppAsset src={metric.icon} width={22} height={22} className="shrink-0 sm:w-6 sm:h-6" />
      </div>
      <div className="flex-1 min-h-2" />
      <span
        className="text-lg sm:text-xl font-bold text-black truncate"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        {metric.amount}
      </span>
      <div className="h-1" />
      <span
        className="text-[11px] sm:text-xs truncate"
        style={{ color: trendColor, fontFamily: "var(--font-poppins)" }}
      >
        {metric.percentageText}
      </span>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl bg-white p-3 sm:p-4" style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
      <div className="h-3 w-2/3 animate-pulse rounded bg-[#ECEDEF]" />
      <div className="flex-1" />
      <div className="h-5 w-1/2 animate-pulse rounded bg-[#ECEDEF]" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-[#ECEDEF]" />
    </div>
  );
}
