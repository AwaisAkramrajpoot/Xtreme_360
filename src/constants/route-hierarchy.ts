import { RouteName } from "./routes";

/** Parent path for professional back navigation (not browser history). */
const PARENT_MAP: Record<string, string> = {
  [RouteName.mainMenu]: RouteName.dashboard,

  [RouteName.sales]: RouteName.mainMenu,
  [RouteName.quotation]: RouteName.sales,
  [RouteName.addQuotation]: RouteName.quotation,
  [RouteName.saleOrder]: RouteName.sales,
  [RouteName.addSaleOrder]: RouteName.saleOrder,
  [RouteName.salesInvoice]: RouteName.sales,
  [RouteName.addSalesInvoice]: RouteName.salesInvoice,
  [RouteName.paymentIn]: RouteName.sales,
  [RouteName.addPaymentIn]: RouteName.paymentIn,
  [RouteName.salesReturn]: RouteName.sales,
  [RouteName.addSalesReturn]: RouteName.salesReturn,
  [RouteName.deliveryNote]: RouteName.sales,
  [RouteName.addDeliveryNote]: RouteName.deliveryNote,

  [RouteName.purchase]: RouteName.mainMenu,
  [RouteName.purchaseOrder]: RouteName.purchase,
  [RouteName.addPurchaseOrder]: RouteName.purchaseOrder,
  [RouteName.purchaseBill]: RouteName.purchase,
  [RouteName.addPurchaseBill]: RouteName.purchaseBill,
  [RouteName.paymentOut]: RouteName.purchase,
  [RouteName.addPaymentOut]: RouteName.paymentOut,
  [RouteName.purchaseReturn]: RouteName.purchase,
  [RouteName.addPurchaseReturn]: RouteName.purchaseReturn,

  [RouteName.cashBank]: RouteName.mainMenu,
  [RouteName.bankAccount]: RouteName.cashBank,
  [RouteName.addBankAccount]: RouteName.bankAccount,
  [RouteName.cashInHand]: RouteName.cashBank,
  [RouteName.cheque]: RouteName.cashBank,
  [RouteName.bankToCashTransfer]: RouteName.cashBank,
  [RouteName.bankToBankTransfer]: RouteName.cashBank,
  [RouteName.cashToBankTransfer]: RouteName.cashBank,
  [RouteName.adjustBankBalance]: RouteName.cashBank,
  [RouteName.loanAmount]: RouteName.cashBank,

  [RouteName.party]: RouteName.mainMenu,
  [RouteName.addParty]: RouteName.party,
  [RouteName.employee]: RouteName.mainMenu,
  [RouteName.addEmployee]: RouteName.employee,
  [RouteName.expense]: RouteName.mainMenu,
  [RouteName.addExpense]: RouteName.expense,
  [RouteName.itemManagement]: RouteName.mainMenu,
  [RouteName.addProduct]: RouteName.itemManagement,
  [RouteName.addManufacturing]: RouteName.itemManagement,
  [RouteName.addService]: RouteName.itemManagement,
  [RouteName.addCategory]: RouteName.itemManagement,
  [RouteName.addUnit]: RouteName.itemManagement,
  [RouteName.setConversion]: RouteName.itemManagement,

  [RouteName.utilities]: RouteName.mainMenu,
  [RouteName.importParty]: RouteName.utilities,
  [RouteName.importExpense]: RouteName.utilities,
  [RouteName.importItem]: RouteName.utilities,
  [RouteName.importBillbook]: RouteName.utilities,
  [RouteName.recycleBin]: RouteName.utilities,
  [RouteName.closingFinancialYears]: RouteName.utilities,
  [RouteName.helpSupport]: RouteName.utilities,

  [RouteName.settings]: RouteName.mainMenu,
  [RouteName.generalSettings]: RouteName.settings,
  [RouteName.transactionSettings]: RouteName.settings,
  [RouteName.invoicePrint]: RouteName.settings,
  [RouteName.taxes]: RouteName.settings,
  [RouteName.reminders]: RouteName.settings,
  [RouteName.itemSettings]: RouteName.settings,
  [RouteName.partySettings]: RouteName.settings,

  [RouteName.marketing]: RouteName.mainMenu,
  [RouteName.backUpAndRestore]: RouteName.mainMenu,
  [RouteName.otherIncome]: RouteName.mainMenu,
  [RouteName.calendar]: RouteName.mainMenu,
  [RouteName.addEventScreen]: RouteName.calendar,
  [RouteName.updateEventScreen]: RouteName.calendar,
  [RouteName.plansAndPricing]: RouteName.mainMenu,
  [RouteName.businessDetail]: RouteName.mainMenu,
  [RouteName.profileDetail]: RouteName.mainMenu,
  [RouteName.userManagement]: RouteName.mainMenu,
  [RouteName.posList]: RouteName.mainMenu,
  [RouteName.pos]: RouteName.posList,
  [RouteName.posBill]: RouteName.posList,

  "/profile": RouteName.dashboard,
  "/quick-menu": RouteName.dashboard,
  "/reports": RouteName.dashboard,
};

export function getParentRoute(pathname: string): string | null {
  if (!pathname) return null;
  if (PARENT_MAP[pathname]) return PARENT_MAP[pathname];

  if (pathname.startsWith("/reports/")) return "/reports";

  // Fallback: strip last segment for nested /main-menu/... paths
  if (pathname.startsWith("/main-menu/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return RouteName.dashboard;
    parts.pop();
    return `/${parts.join("/")}`;
  }
  return null;
}

export function shouldShowBack(pathname: string): boolean {
  if (!pathname || pathname === RouteName.dashboard) return false;
  return Boolean(getParentRoute(pathname));
}
