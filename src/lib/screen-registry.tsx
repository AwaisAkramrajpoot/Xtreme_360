import { SplashView } from "@/features/intro/SplashView";
import { OnboardingScreen } from "@/features/intro/OnboardingScreen";
import { WelcomeScreen } from "@/features/intro/WelcomeScreen";
import { LanguageSelectionScreen } from "@/features/intro/LanguageSelectionScreen";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { RegisterScreen } from "@/features/auth/RegisterScreen";
import { VerifyEmailScreen } from "@/features/auth/AuthScreens";
import { VerifyOtpPage } from "@/features/auth/VerifyOtpPage";
import { NewPasswordPage } from "@/features/auth/NewPasswordPage";
import { BusinessRegisteration } from "@/features/business/BusinessRegisteration";
import { BottomBarLayout } from "@/components/layout/BottomBarLayout";
import { ProfileScreen } from "@/features/app/profile/ProfileScreen";
import { QuickMenuScreen } from "@/features/app/quick-menu/QuickMenuScreen";
import { ReportsScreen } from "@/features/app/reports/ReportsScreen";
import { ReportViewScreen } from "@/features/app/reports/ReportViewScreen";
import { MainMenuScreen } from "@/features/app/main-menu/MainMenuScreen";
import {
  SalesScreen,
  PurchaseScreen,
  CashBankScreen,
  UtilitiesScreen,
  MarketingScreen,
} from "@/features/app/hub/MenuHubScreen";
import { SettingsScreen } from "@/features/app/settings/SettingsScreen";
import { GeneralSettingsScreen } from "@/features/app/settings/GeneralSettingsScreen";
import { TransactionSettingsScreen } from "@/features/app/settings/TransactionSettingsScreen";
import { InvoicePrintScreen } from "@/features/app/settings/InvoicePrintScreen";
import { TaxListScreen } from "@/features/app/settings/TaxListScreen";
import { RemindersScreen } from "@/features/app/settings/RemindersScreen";
import { ItemSettingsScreen } from "@/features/app/settings/ItemSettingsScreen";
import { PartySettingsScreen } from "@/features/app/settings/PartySettingsScreen";
import { PartyScreen, ExpenseScreen, EmployeeScreen } from "@/features/app/lists/ListScreens";
import {
  QuotationScreen,
  SaleOrderScreen,
  SalesInvoiceScreen,
  PaymentInScreen,
  SalesReturnScreen,
  DeliveryNoteScreen,
  PurchaseOrderScreen,
  PurchaseBillScreen,
  PaymentOutScreen,
  PurchaseReturnScreen,
  SalesAddRedirectScreen,
} from "@/features/app/sales/SalesDocumentScreen";
import { SALES_MODULES } from "@/features/app/sales/sales-config";
import { ItemManagementScreen } from "@/features/app/misc/ItemManagementScreen";
import {
  PlansAndPricingScreen,
  ProfileDetailScreen,
  BusinessDetailScreen,
} from "@/features/app/misc/MiscScreens";
import {
  BankAccountScreen,
  CashInHandScreen,
  ChequeScreen,
  LoanAmountScreen,
  TransferScreen,
} from "@/features/app/cash-bank/CashBankScreens";
import { CalendarScreen } from "@/features/app/calendar/CalendarScreen";
import { OtherIncomeScreen } from "@/features/app/other-income/OtherIncomeScreen";
import { ImportScreen } from "@/features/app/imports/ImportScreen";
import { TeamScreen } from "@/features/app/team/TeamScreen";
import { WhatsAppMarketingScreen } from "@/features/app/marketing/WhatsAppMarketingScreen";
import { BackupAndRestoreScreen, CloseFinancialYearsScreen, RecycleBinScreen } from "@/features/app/data-tools/DataToolsScreens";
import { HelpSupportScreen } from "@/features/app/support/HelpSupportScreen";
import { POSListScreen, POSTerminalScreen } from "@/features/app/pos/POSScreens";
import { RouteName } from "@/constants/routes";

type ScreenComponent = React.ComponentType;

export const screenRegistry: Record<string, ScreenComponent> = {
  "/": SplashView,
  "/onBoarding": OnboardingScreen,
  "/login": LoginScreen,
  "/register": RegisterScreen,
  "/newPassword": NewPasswordPage,
  "/verifyEmail": VerifyEmailScreen,
  "/verifyOtp": VerifyOtpPage,
  "/languageSelection": LanguageSelectionScreen,
  "/welcome": WelcomeScreen,
  "/dashboard": BottomBarLayout,
  "/profile": ProfileScreen,
  "/quick-menu": QuickMenuScreen,
  "/reports": ReportsScreen,
  [RouteName.mainMenu]: MainMenuScreen,
  "/businessRegisteration": BusinessRegisteration,

  [RouteName.party]: PartyScreen,
  [RouteName.addParty]: () => <PartyScreen openAdd />,
  [RouteName.employee]: EmployeeScreen,
  [RouteName.addEmployee]: () => <EmployeeScreen openAdd />,
  [RouteName.expense]: ExpenseScreen,
  [RouteName.addExpense]: () => <ExpenseScreen openAdd />,
  [RouteName.itemManagement]: ItemManagementScreen,
  [RouteName.addProduct]: () => <ItemManagementScreen initialTab="products" openAdd />,
  [RouteName.addCategory]: () => <ItemManagementScreen initialTab="categories" openAdd />,
  [RouteName.addUnit]: () => <ItemManagementScreen initialTab="units" openAdd />,
  [RouteName.addService]: () => <ItemManagementScreen initialTab="services" openAdd />,
  [RouteName.addManufacturing]: () => <ItemManagementScreen initialTab="manufacturing" openAdd />,
  [RouteName.setConversion]: () => <ItemManagementScreen initialTab="units" openConversion />,

  [RouteName.sales]: SalesScreen,
  [RouteName.quotation]: QuotationScreen,
  [RouteName.addQuotation]: () => <SalesAddRedirectScreen config={SALES_MODULES.quotation} />,
  [RouteName.saleOrder]: SaleOrderScreen,
  [RouteName.addSaleOrder]: () => <SalesAddRedirectScreen config={SALES_MODULES.sale_order} />,
  [RouteName.salesInvoice]: SalesInvoiceScreen,
  [RouteName.addSalesInvoice]: () => <SalesAddRedirectScreen config={SALES_MODULES.sales_invoice} />,
  [RouteName.paymentIn]: PaymentInScreen,
  [RouteName.addPaymentIn]: () => <SalesAddRedirectScreen config={SALES_MODULES.payment_in} />,
  [RouteName.salesReturn]: SalesReturnScreen,
  [RouteName.addSalesReturn]: () => <SalesAddRedirectScreen config={SALES_MODULES.sales_return} />,
  [RouteName.deliveryNote]: DeliveryNoteScreen,
  [RouteName.addDeliveryNote]: () => <SalesAddRedirectScreen config={SALES_MODULES.delivery_note} />,

  [RouteName.purchase]: PurchaseScreen,
  [RouteName.purchaseOrder]: PurchaseOrderScreen,
  [RouteName.addPurchaseOrder]: () => <SalesAddRedirectScreen config={SALES_MODULES.purchase_order} />,
  [RouteName.purchaseBill]: PurchaseBillScreen,
  [RouteName.addPurchaseBill]: () => <SalesAddRedirectScreen config={SALES_MODULES.purchase_bill} />,
  [RouteName.paymentOut]: PaymentOutScreen,
  [RouteName.addPaymentOut]: () => <SalesAddRedirectScreen config={SALES_MODULES.payment_out} />,
  [RouteName.purchaseReturn]: PurchaseReturnScreen,
  [RouteName.addPurchaseReturn]: () => <SalesAddRedirectScreen config={SALES_MODULES.purchase_return} />,

  [RouteName.cashBank]: CashBankScreen,
  [RouteName.bankAccount]: BankAccountScreen,
  [RouteName.addBankAccount]: () => <BankAccountScreen openAdd />,
  [RouteName.cashInHand]: CashInHandScreen,
  [RouteName.cheque]: ChequeScreen,
  [RouteName.bankToCashTransfer]: () => <TransferScreen type="bank_to_cash" />,
  [RouteName.bankToBankTransfer]: () => <TransferScreen type="bank_to_bank" />,
  [RouteName.cashToBankTransfer]: () => <TransferScreen type="cash_to_bank" />,
  [RouteName.adjustBankBalance]: () => <TransferScreen type="adjust_bank" />,
  [RouteName.loanAmount]: LoanAmountScreen,

  [RouteName.calendar]: CalendarScreen,
  [RouteName.addEventScreen]: () => <CalendarScreen openAdd />,
  [RouteName.updateEventScreen]: CalendarScreen,
  [RouteName.plansAndPricing]: PlansAndPricingScreen,
  [RouteName.backUpAndRestore]: BackupAndRestoreScreen,
  [RouteName.otherIncome]: OtherIncomeScreen,
  [RouteName.marketing]: MarketingScreen,
  [RouteName.whatsappMarketing]: WhatsAppMarketingScreen,
  [RouteName.utilities]: UtilitiesScreen,
  [RouteName.settings]: SettingsScreen,
  [RouteName.generalSettings]: GeneralSettingsScreen,
  [RouteName.transactionSettings]: TransactionSettingsScreen,
  [RouteName.invoicePrint]: InvoicePrintScreen,
  [RouteName.taxes]: TaxListScreen,
  [RouteName.reminders]: RemindersScreen,
  [RouteName.itemSettings]: ItemSettingsScreen,
  [RouteName.partySettings]: PartySettingsScreen,
  [RouteName.profileDetail]: ProfileDetailScreen,
  [RouteName.businessDetail]: BusinessDetailScreen,
  [RouteName.importParty]: () => <ImportScreen kind="parties" />,
  [RouteName.importExpense]: () => <ImportScreen kind="expenses" />,
  [RouteName.importItem]: () => <ImportScreen kind="items" />,
  [RouteName.importBillbook]: () => <ImportScreen kind="billbook" />,
  [RouteName.recycleBin]: RecycleBinScreen,
  [RouteName.closingFinancialYears]: CloseFinancialYearsScreen,
  [RouteName.helpSupport]: HelpSupportScreen,
  [RouteName.posList]: POSListScreen,
  [RouteName.pos]: POSTerminalScreen,
  [RouteName.posBill]: POSTerminalScreen,
  [RouteName.userManagement]: TeamScreen,
};

/**
 * Screen for a route: exact registry match first, then dynamic routes.
 * /reports/<key> renders the report viewer; unknown keys show a "not found" state there.
 */
export function resolveScreen(route: string): React.ReactElement | null {
  const Screen = screenRegistry[route];
  if (Screen) return <Screen />;
  const report = /^\/reports\/([a-z0-9-]+)$/.exec(route);
  if (report) return <ReportViewScreen reportKey={report[1]} />;
  return null;
}
