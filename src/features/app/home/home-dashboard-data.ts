import { AppImages } from "@/constants/images";

export interface DashboardMetric {
  title: string;
  amount: string;
  percentageText: string;
  isPositive: boolean;
  icon: string;
}

export const homeDashboardMetrics: DashboardMetric[] = [
  { title: "Cash Flow", amount: "Rs 100,000", percentageText: "+12.5% from last month", isPositive: true, icon: AppImages.cashFlow },
  { title: "Bank Balance", amount: "Rs 200,000", percentageText: "+12.5% from last month", isPositive: true, icon: AppImages.bank },
  { title: "Total Sale", amount: "Rs 800,000", percentageText: "+12.5% from last month", isPositive: true, icon: AppImages.totalSales },
  { title: "Sale Returns", amount: "Rs 50,000", percentageText: "-12.5% from last month", isPositive: false, icon: AppImages.saleReturns },
  { title: "Outstanding (Receivable)", amount: "Rs 10,00,000", percentageText: "+12.5% from last month", isPositive: true, icon: AppImages.receivable },
  { title: "Outstanding (Payable)", amount: "Rs 3,00,000", percentageText: "+12.5% from last month", isPositive: false, icon: AppImages.payable },
  { title: "Purchases", amount: "Rs 7,50,000", percentageText: "-12.5% from last month", isPositive: false, icon: AppImages.purchases },
  { title: "Purchases Returns", amount: "Rs 50,000", percentageText: "-12.5% from last month", isPositive: false, icon: AppImages.saleReturns },
];

export const quotationMetrics = [
  { count: "24", label: "Pending" },
  { count: "142", label: "Approved" },
  { count: "12", label: "Rejected" },
  { count: "121", label: "Total" },
];

export const inventoryMetrics = [
  { title: "Current Inventory", value: "$8,248", subValue: "1250 items", progress: 0.7 },
  { title: "Low Stock Items", value: "$8,248", subValue: "1250 items", progress: 0.4 },
  { title: "Dead stock", value: "$8,248", subValue: "1250 items", progress: 0.25 },
];
