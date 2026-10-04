import { AppColors } from "@/constants/colors";
import type { DashboardSummary } from "@/services/dashboard-api";

export function QuotationSummary({ quotations }: { quotations: DashboardSummary["quotations"] }) {
  const metrics = [
    { label: "Pending", count: quotations.pending },
    { label: "Approved", count: quotations.approved },
    { label: "Rejected", count: quotations.rejected },
    { label: "Total", count: quotations.total },
  ];

  return (
    <div className="min-w-0">
      <h2
        className="text-base sm:text-lg font-bold text-black"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        Quotation Summary
      </h2>
      <p className="text-xs sm:text-sm" style={{ color: AppColors.grey }}>
        Current month overview
      </p>
      <div className="h-3 sm:h-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="py-3 px-2 rounded-lg text-center min-w-0"
            style={{ backgroundColor: AppColors.bgColor2 }}
          >
            <p className="text-sm sm:text-base font-bold text-black">{m.count}</p>
            <div className="h-1" />
            <p className="text-[10px] sm:text-xs truncate px-1" style={{ color: AppColors.greyishBlack }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
