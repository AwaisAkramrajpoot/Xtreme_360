import { AppImages } from "@/constants/images";
import { formatMoney, type GeneralUiSettings } from "@/constants/app-settings";
import type { DashboardSummary, MonthOverMonth } from "@/services/dashboard-api";

export interface DashboardMetric {
  title: string;
  amount: string;
  percentageText: string;
  /** true = good (green), false = bad (red), null = informational (grey). */
  isPositive: boolean | null;
  icon: string;
}

type Money = Pick<GeneralUiSettings, "currency" | "decimalPlaces">;

/** "+12.5% from last month" style text for a month-over-month flow. */
function trend(value: MonthOverMonth, higherIsBetter: boolean) {
  if (!value.previous) {
    return {
      percentageText: value.current ? "No data for last month" : "No activity this month",
      isPositive: null,
    };
  }
  const change = ((value.current - value.previous) / Math.abs(value.previous)) * 100;
  const sign = change > 0 ? "+" : "";
  return {
    percentageText: `${sign}${change.toFixed(1)}% from last month`,
    isPositive: change === 0 ? null : change > 0 === higherIsBetter,
  };
}

export function buildDashboardMetrics(summary: DashboardSummary, money: Money): DashboardMetric[] {
  const fmt = (value: number) => formatMoney(value, money);
  const flow = (title: string, icon: string, value: MonthOverMonth, higherIsBetter: boolean) => ({
    title,
    icon,
    amount: fmt(value.current),
    ...trend(value, higherIsBetter),
  });
  const balance = (title: string, icon: string, value: number, note: string) => ({
    title,
    icon,
    amount: fmt(value),
    percentageText: note,
    isPositive: null,
  });

  return [
    flow("Cash Flow", AppImages.cashFlow, summary.cashFlow, true),
    balance("Bank Balance", AppImages.bank, summary.bankBalance, "Across all bank accounts"),
    flow("Total Sale", AppImages.totalSales, summary.sales, true),
    flow("Sale Returns", AppImages.saleReturns, summary.salesReturns, false),
    balance("Outstanding (Receivable)", AppImages.receivable, summary.receivable, "Unpaid sales invoices"),
    balance("Outstanding (Payable)", AppImages.payable, summary.payable, "Unpaid purchase bills"),
    flow("Purchases", AppImages.purchases, summary.purchases, false),
    flow("Purchase Returns", AppImages.saleReturns, summary.purchaseReturns, true),
  ];
}
