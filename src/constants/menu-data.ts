import { AppImages } from "./images";
import { RouteName } from "./routes";

export interface MenuItem {
  title: string;
  image?: string;
  href?: string;
}

export const quickMenuItems: MenuItem[] = [
  { title: "Quotation", href: RouteName.quotation },
  { title: "Sales Order", href: RouteName.saleOrder },
  { title: "Payment In", href: RouteName.paymentIn },
  { title: "Delivery Note", href: RouteName.deliveryNote },
  { title: "Sales Return", href: RouteName.salesReturn },
  { title: "Expenses", href: RouteName.expense },
  { title: "Purchase", href: RouteName.purchase },
  { title: "Purchased Order", href: RouteName.purchaseOrder },
  { title: "Payment Out", href: RouteName.paymentOut },
  { title: "Purchased Return", href: RouteName.purchaseReturn },
  { title: "Bank Account", href: RouteName.bankAccount },
  { title: "Cash Account", href: RouteName.cashInHand },
];

export const mainMenuItems: MenuItem[] = [
  { title: "Business Detail", image: AppImages.businessDetail, href: RouteName.businessDetail },
  { title: "Profile", image: AppImages.menuProfile, href: RouteName.profileDetail },
  { title: "User Management", image: AppImages.userManagement, href: RouteName.userManagement },
  { title: "Employee", image: AppImages.employee, href: RouteName.employee },
  { title: "Party", image: AppImages.party, href: RouteName.party },
  { title: "Sales", image: AppImages.sales, href: RouteName.sales },
  { title: "Purchase", image: AppImages.purchase, href: RouteName.purchase },
  { title: "Item", image: AppImages.item, href: RouteName.itemManagement },
  { title: "expense", image: AppImages.expense, href: RouteName.expense },
  { title: "Cash & Bank", image: AppImages.cashBank, href: RouteName.cashBank },
  { title: "Other Income", image: AppImages.otherIncome, href: RouteName.otherIncome },
  { title: "Utilities", image: AppImages.utilities, href: RouteName.utilities },
  { title: "Marketing", image: AppImages.marketing, href: RouteName.marketing },
  { title: "Backup & Restore", image: AppImages.backupRestore, href: RouteName.backUpAndRestore },
  { title: "Calendar", image: AppImages.calendar, href: RouteName.calendar },
  { title: "POS", image: AppImages.item, href: RouteName.posList },
  { title: "Plans & Pricing", image: AppImages.plansPricing, href: RouteName.plansAndPricing },
  { title: "Setting", image: AppImages.setting, href: RouteName.settings },
  { title: "Log Out" },
];

export const salesItems: MenuItem[] = [
  { title: "Estimate/Quotation", href: RouteName.quotation },
  { title: "Sales Order", href: RouteName.saleOrder },
  { title: "Sales Invoice", href: RouteName.salesInvoice },
  { title: "Payment In", href: RouteName.paymentIn },
  { title: "Sales Return(credit note)", href: RouteName.salesReturn },
  { title: "Delivery Note", href: RouteName.deliveryNote },
];

export const purchaseItems: MenuItem[] = [
  { title: "Purchase Order", href: RouteName.purchaseOrder },
  { title: "Purchase Bill", href: RouteName.purchaseBill },
  { title: "Payment Out", href: RouteName.paymentOut },
  { title: "Purchase Return", href: RouteName.purchaseReturn },
];

export const cashBankItems: MenuItem[] = [
  { title: "Bank Account", href: RouteName.bankAccount },
  { title: "Cash in hand", href: RouteName.cashInHand },
  { title: "Cheques", href: RouteName.cheque },
  { title: "Loan amount", href: RouteName.loanAmount },
];

export const utilitiesItems: MenuItem[] = [
  { title: "Import Items", href: RouteName.importItem },
  { title: "Import Parties", href: RouteName.importParty },
  { title: "Import expense", href: RouteName.importExpense },
  { title: "Import from billbook", href: RouteName.importBillbook },
  { title: "Recycle bin", href: RouteName.recycleBin },
  { title: "Close financial years", href: RouteName.closingFinancialYears },
];

export const settingsItems: MenuItem[] = [
  { title: "General", image: AppImages.setting, href: RouteName.generalSettings },
  { title: "Transaction", image: AppImages.transaction, href: RouteName.transactionSettings },
  { title: "Invoice Print", image: AppImages.invoicePrint, href: RouteName.invoicePrint },
  { title: "Taxes", image: AppImages.tax, href: RouteName.taxes },
  { title: "Reminders", image: AppImages.reminder, href: RouteName.reminders },
  { title: "Item", image: AppImages.item, href: RouteName.itemSettings },
  { title: "Party", image: AppImages.party, href: RouteName.partySettings },
];

export const backupAndRestoreItems: MenuItem[] = [
  { title: "Auto back up" },
  { title: "Backup for phone" },
  { title: "Backup to email id" },
  { title: "Restote backup" },
];

export const marketingItems: MenuItem[] = [
  { title: "Google profile management" },
  { title: "Whatsapp marketing" },
];

export const reportGroups = [
  {
    title: "Transaction",
    options: [
      "Sale Report",
      "Purchase Report",
      "Day Book",
      "All Transaction Report",
      "Profit & Loss Report",
      "Balance Sheet",
      "Trial Balance",
      "Cash Flow",
    ],
  },
  {
    title: "Party reports",
    options: [
      "Party Statement",
      "Party Wise Profit",
      "Party Report By Item",
      "Party Outstanding",
      "Party Wise Sale/Purchase",
    ],
  },
  {
    title: "Item/Stock reports",
    options: [
      "Stock Summary",
      "Stock Detail",
      "Item Report By Party",
      "Low Stock Summary",
      "Item Detail",
      "Stock Summary Report By Item Category",
      "Item Wise Profit And Loss",
      "Item Batch Report",
      "Stock Detail Report",
      "Item Report",
      "Item Stock Tracking",
    ],
  },
  {
    title: "Business status",
    options: ["Business Overview", "Bank Statement"],
  },
  {
    title: "Expense reports",
    options: ["Expense Report", "Expense Category Report", "Expense Item Report"],
  },
  {
    title: "Sale/Purchase Order reports",
    options: ["Sale Order Report", "Purchase Order Report"],
  },
  {
    title: "Other Income",
    options: ["Other Income Report", "Other Income Category Report", "Other Income Item Report"],
  },
  {
    title: "Loan Reports",
    options: ["Loan Statement"],
  },
];
