import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type MonthOverMonth = { current: number; previous: number };
export type CountValue = { count: number; value: number };

export type DashboardSummary = {
  sales: MonthOverMonth;
  salesReturns: MonthOverMonth;
  purchases: MonthOverMonth;
  purchaseReturns: MonthOverMonth;
  cashFlow: MonthOverMonth;
  receivable: number;
  payable: number;
  bankBalance: number;
  quotations: { pending: number; approved: number; rejected: number; total: number };
  cancelledInvoices: CountValue;
  inventory: {
    productCount: number;
    inStock: CountValue;
    lowStock: CountValue;
    deadStock: CountValue;
  };
  /** Last 6 months, oldest first; month is YYYY-MM. */
  monthly: Array<{ month: string; sales: number; purchases: number }>;
};

export async function getDashboardSummary() {
  const response = await apiClient.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return unwrap(response);
}
