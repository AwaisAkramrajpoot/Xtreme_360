"use client";


import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { formatMoney } from "@/constants/app-settings";
import { getDashboardSummary, type DashboardSummary } from "@/services/dashboard-api";
import { useSettingsStore } from "@/stores/settings-store";
import { useAsyncData } from "@/hooks/use-async-data";
import { buildDashboardMetrics } from "./home-dashboard-data";
import { MetricCard, MetricCardSkeleton } from "./MetricCard";
import { QuotationSummary } from "./QuotationSummary";
import { InventoryStatus } from "./InventoryStatus";
import { SaleVsPurchaseGraph } from "./SaleVsPurchaseGraph";
import { StaffHome } from "./StaffHome";
import { useRole } from "@/hooks/use-role";

const loadSummary = async () => (await getDashboardSummary()) ?? null;

export function HomeScreen() {
  // Staff cannot see business-wide totals; they get a shortcuts home instead.
  return useRole() === "staff" ? <StaffHome /> : <OwnerHome />;
}

function OwnerHome() {
  const general = useSettingsStore((s) => s.app.general);
  const { data: summary, loading, error, reload: load } = useAsyncData<DashboardSummary | null>(
    loadSummary,
    null,
    "Failed to load dashboard"
  );
  const money = (value: number) => formatMoney(value, general);

  const metrics = summary ? buildDashboardMetrics(summary, general) : [];

  return (
    <div className="min-h-full flex flex-col min-w-0">
      <AppAppBar
        title="Dashboard"
        showNotification
        showAvatar
        subtitle="Welcome back, here's your business overview"
      />
      <div className="flex-1 min-w-0">
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "#F2C2C2", backgroundColor: "#FDF1F1", color: "#8A2B2B" }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg px-3 py-1.5 font-semibold text-white"
              style={{ backgroundColor: AppColors.primary }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {loading && !summary
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="min-h-[120px] sm:min-h-[140px] min-w-0">
                  <MetricCardSkeleton />
                </div>
              ))
            : metrics.map((metric) => (
                <div key={metric.title} className="min-h-[120px] sm:min-h-[140px] min-w-0">
                  <MetricCard metric={metric} />
                </div>
              ))}
        </div>

        {summary && (
          <>
            <div className="h-5 sm:h-6 lg:h-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-0">
              <div className="min-w-0">
                <QuotationSummary quotations={summary.quotations} />
              </div>
              <div
                className="p-4 sm:p-5 lg:p-6 rounded-xl min-w-0"
                style={{ backgroundColor: AppColors.bgColor2 }}
              >
                <p className="text-sm sm:text-base" style={{ color: AppColors.grey }}>
                  Cancelled Invoices
                </p>
                <div className="h-2" />
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">
                  {summary.cancelledInvoices.count}
                </p>
                <p className="text-xs sm:text-sm mt-1" style={{ color: AppColors.grey }}>
                  {money(summary.cancelledInvoices.value)} total value
                </p>
              </div>
            </div>
            <div className="h-5 sm:h-6 lg:h-8" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-0">
              <div className="min-w-0 overflow-hidden">
                <InventoryStatus inventory={summary.inventory} money={money} />
              </div>
              <div
                className="min-w-0 overflow-hidden p-4 sm:p-5 lg:p-6 rounded-xl bg-white border"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                <SaleVsPurchaseGraph monthly={summary.monthly} money={money} />
              </div>
            </div>
          </>
        )}
        <div className="h-4 sm:h-6" />
      </div>
    </div>
  );
}
