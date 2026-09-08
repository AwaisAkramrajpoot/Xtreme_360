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
import { MainMenuScreen } from "@/features/app/main-menu/MainMenuScreen";
import {
  SalesScreen,
  PurchaseScreen,
  CashBankScreen,
  UtilitiesScreen,
  MarketingScreen,
  BackupAndRestoreScreen,
} from "@/features/app/hub/MenuHubScreen";
import { SettingsScreen } from "@/features/app/settings/SettingsScreen";
import { GeneralSettingsScreen } from "@/features/app/settings/GeneralSettingsScreen";
import { TransactionSettingsScreen } from "@/features/app/settings/TransactionSettingsScreen";
import { InvoicePrintScreen } from "@/features/app/settings/InvoicePrintScreen";
import { TaxListScreen } from "@/features/app/settings/TaxListScreen";
import { RemindersScreen } from "@/features/app/settings/RemindersScreen";
import { PartyScreen, ExpenseScreen, EmployeeScreen } from "@/features/app/lists/ListScreens";
import {
  AddPartyScreen,
  AddEmployeeScreen,
  AddExpenseScreen,
  AddProductScreen,
  AddCategoryScreen,
  AddUnitScreen,
  AddServiceScreen,
  AddBankAccountScreen,
  GenericTransactionScreen,
  AddFormScreen,
} from "@/features/app/forms/AddFormScreens";
import {
  QuotationScreen,
  SaleOrderScreen,
  SalesInvoiceScreen,
  PaymentInScreen,
  SalesReturnScreen,
  DeliveryNoteScreen,
  SalesAddRedirectScreen,
} from "@/features/app/sales/SalesDocumentScreen";
import { SALES_MODULES } from "@/features/app/sales/sales-config";
import { ItemManagementScreen } from "@/features/app/misc/ItemManagementScreen";
import {
  CalendarScreen,
  POSScreen,
  PlansAndPricingScreen,
  UserManagementScreen,
  ImportBaseScreen,
  ProfileDetailScreen,
  BusinessDetailScreen,
  OtherIncomeScreen,
  RecycleBinScreen,
  CloseFinancialYearsScreen,
  CashInHandScreen,
  LoanAmountScreen,
  ChequeScreen,
  BankAccountScreen,
  TransferScreen,
} from "@/features/app/misc/MiscScreens";

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
  "/main-menu": MainMenuScreen,
  "/businessRegisteration": BusinessRegisteration,
  "/party": PartyScreen,
  "/addParty": AddPartyScreen,
  "/employee": EmployeeScreen,
  "/addEmployee": AddEmployeeScreen,
  "/expense": ExpenseScreen,
  "/addExpense": AddExpenseScreen,
  "/itemManagement": ItemManagementScreen,
  "/addProduct": AddProductScreen,
  "/addCategory": AddCategoryScreen,
  "/addUnit": AddUnitScreen,
  "/addService": AddServiceScreen,
  "/addManufacturing": () => <AddFormScreen title="Add Manufacturing" fields={[{ title: "Manufacturing Name", hintText: "Enter name" }]} />,
  "/setConversion": () => <AddFormScreen title="Set Conversion" fields={[{ title: "From Unit", hintText: "Select unit" }, { title: "To Unit", hintText: "Select unit" }, { title: "Conversion Rate", hintText: "1.0" }]} />,
  "/sales": SalesScreen,
  "/quotation": QuotationScreen,
  "/addQuotation": () => <SalesAddRedirectScreen config={SALES_MODULES.quotation} />,
  "/saleOrder": SaleOrderScreen,
  "/addSaleOrder": () => <SalesAddRedirectScreen config={SALES_MODULES.sale_order} />,
  "/salesInvoice": SalesInvoiceScreen,
  "/addSalesInvoice": () => <SalesAddRedirectScreen config={SALES_MODULES.sales_invoice} />,
  "/paymentIn": PaymentInScreen,
  "/addPaymentIn": () => <SalesAddRedirectScreen config={SALES_MODULES.payment_in} />,
  "/salesReturn": SalesReturnScreen,
  "/addSalesReturn": () => <SalesAddRedirectScreen config={SALES_MODULES.sales_return} />,
  "/deliveryNote": DeliveryNoteScreen,
  "/addDeliveryNote": () => <SalesAddRedirectScreen config={SALES_MODULES.delivery_note} />,
  "/purchase": PurchaseScreen,
  "/purchaseOrder": () => <GenericTransactionScreen title="Purchase Order" />,
  "/addPurchaseOrder": () => <AddFormScreen title="Add Purchase Order" submitLabel="Save Order" fields={[{ title: "Party", hintText: "Select party" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/purchaseBill": () => <GenericTransactionScreen title="Purchase Bill" />,
  "/addPurchaseBill": () => <AddFormScreen title="Add Purchase Bill" submitLabel="Save Bill" fields={[{ title: "Party", hintText: "Select party" }, { title: "Bill Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/paymentOut": () => <GenericTransactionScreen title="Payment Out" />,
  "/addPaymentOut": () => <AddFormScreen title="Add Payment Out" submitLabel="Save Payment" fields={[{ title: "Party", hintText: "Select party" }, { title: "Amount", hintText: "0.00" }]} />,
  "/purchaseReturn": () => <GenericTransactionScreen title="Purchase Return" />,
  "/addPurchaseReturn": () => <AddFormScreen title="Add Purchase Return" submitLabel="Save Return" fields={[{ title: "Party", hintText: "Select party" }]} />,
  "/cashBank": CashBankScreen,
  "/bankAccount": BankAccountScreen,
  "/addBankAccount": AddBankAccountScreen,
  "/cashInHand": CashInHandScreen,
  "/cheque": ChequeScreen,
  "/bankToCashTransfer": () => <TransferScreen title="Bank to Cash Transfer" />,
  "/bankToBankTransfer": () => <TransferScreen title="Bank to Bank Transfer" />,
  "/cashToBankTransfer": () => <TransferScreen title="Cash to Bank Transfer" />,
  "/adjustBankBalance": () => <TransferScreen title="Adjust Bank Balance" />,
  "/loanAmount": LoanAmountScreen,
  "/calendar": CalendarScreen,
  "/addEventScreen": () => <AddFormScreen title="Add Event" submitLabel="Save Event" fields={[{ title: "Event Title", hintText: "Enter title" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }, { title: "Time", hintText: "HH:MM" }, { title: "Description", hintText: "Enter description", maxLines: 2 }]} />,
  "/updateEventScreen": () => <AddFormScreen title="Update Event" submitLabel="Update Event" fields={[{ title: "Event Title", hintText: "Enter title" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/plansAndPricing": PlansAndPricingScreen,
  "/backUpAndRestore": BackupAndRestoreScreen,
  "/otherIncome": OtherIncomeScreen,
  "/marketing": MarketingScreen,
  "/utilities": UtilitiesScreen,
  "/settings": SettingsScreen,
  "/generalSettings": GeneralSettingsScreen,
  "/transactionSettings": TransactionSettingsScreen,
  "/invoicePrint": InvoicePrintScreen,
  "/taxes": TaxListScreen,
  "/reminders": RemindersScreen,
  "/itemSettings": () => <AddFormScreen title="Item Settings" submitLabel="Save" fields={[{ title: "Enable Barcode", hintText: "Yes/No" }, { title: "Default Unit", hintText: "Select unit" }]} />,
  "/partySettings": () => <AddFormScreen title="Party Settings" submitLabel="Save" fields={[{ title: "Credit Limit", hintText: "0.00" }, { title: "Payment Terms", hintText: "30 days" }]} />,
  "/profileDetail": ProfileDetailScreen,
  "/businessDetail": BusinessDetailScreen,
  "/importParty": () => <ImportBaseScreen title="Import Parties" />,
  "/importExpense": () => <ImportBaseScreen title="Import Expense" />,
  "/importItem": () => <ImportBaseScreen title="Import Items" />,
  "/importBillbook": () => <ImportBaseScreen title="Import from Billbook" />,
  "/recycleBin": RecycleBinScreen,
  "/closingFinancialYears": CloseFinancialYearsScreen,
  "/posList": () => <GenericTransactionScreen title="POS List" />,
  "/pos": POSScreen,
  "/posBill": () => <AddFormScreen title="POS Bill" submitLabel="Print Bill" fields={[{ title: "Customer", hintText: "Walk-in" }, { title: "Payment Method", hintText: "Cash" }]} />,
  "/userManagement": UserManagementScreen,
};
