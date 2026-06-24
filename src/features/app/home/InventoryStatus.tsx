import { AppColors } from "@/constants/colors";
import { inventoryMetrics } from "./home-dashboard-data";

export function InventoryStatus() {
  return (
    <div className="min-w-0 p-4 sm:p-5 lg:p-6 rounded-xl bg-white border"
      style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      <h2
        className="text-base sm:text-lg font-bold text-black"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        Inventory Status
      </h2>
      <p className="text-xs sm:text-sm" style={{ color: AppColors.grey }}>
        Total value: $ 10,56,000
      </p>
      <div className="h-3 sm:h-4" />
      {inventoryMetrics.map((item) => (
        <div
          key={item.title}
          className="p-3 sm:p-4 rounded-lg mb-2 sm:mb-3 last:mb-0"
          style={{ backgroundColor: AppColors.bgColor2 }}
        >
          <div className="flex justify-between items-start gap-3 min-w-0">
            <span className="text-sm sm:text-base font-bold text-black truncate">{item.title}</span>
            <div className="text-right shrink-0">
              <p className="text-sm sm:text-base font-bold text-black">{item.value}</p>
              <p className="text-[10px] sm:text-xs" style={{ color: AppColors.grey }}>
                {item.subValue}
              </p>
            </div>
          </div>
          <div className="h-2 sm:h-3" />
          <div className="h-1.5 rounded bg-white overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${item.progress * 100}%`, backgroundColor: AppColors.primary }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
