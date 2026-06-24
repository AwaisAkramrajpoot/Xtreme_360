import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { homeDashboardMetrics } from "./home-dashboard-data";
import { MetricCard } from "./MetricCard";
import { QuotationSummary } from "./QuotationSummary";
import { InventoryStatus } from "./InventoryStatus";
import { SaleVsPurchaseGraph } from "./SaleVsPurchaseGraph";

export function HomeScreen() {
  return (
    <div className="min-h-full flex flex-col min-w-0">
      <AppAppBar
        title="Dashboard"
        showNotification
        showAvatar
        subtitle="Welcome back, here's your business overview"
      />
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {homeDashboardMetrics.map((metric) => (
            <div key={metric.title} className="min-h-[120px] sm:min-h-[140px] min-w-0">
              <MetricCard metric={metric} />
            </div>
          ))}
        </div>
        <div className="h-5 sm:h-6 lg:h-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-0">
          <div className="min-w-0">
            <QuotationSummary />
          </div>
          <div
            className="p-4 sm:p-5 lg:p-6 rounded-xl min-w-0"
            style={{ backgroundColor: AppColors.bgColor2 }}
          >
            <p className="text-sm sm:text-base" style={{ color: AppColors.grey }}>
              Cancelled Invoices
            </p>
            <div className="h-2" />
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">18</p>
            <p className="text-xs sm:text-sm mt-1" style={{ color: AppColors.grey }}>
              $1,24,560 total value
            </p>
          </div>
        </div>
        <div className="h-5 sm:h-6 lg:h-8" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-0">
          <div className="min-w-0 overflow-hidden">
            <InventoryStatus />
          </div>
          <div className="min-w-0 overflow-hidden p-4 sm:p-5 lg:p-6 rounded-xl bg-white border"
            style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
          >
            <SaleVsPurchaseGraph />
          </div>
        </div>
        <div className="h-4 sm:h-6" />
      </div>
    </div>
  );
}
