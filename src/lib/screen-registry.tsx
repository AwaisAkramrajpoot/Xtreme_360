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
  "/bottomBar": BottomBarLayout,
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
  "/quotation": () => <GenericTransactionScreen title="Quotation" />,
  "/addQuotation": () => <AddFormScreen title="Add Quotation" submitLabel="Save Quotation" fields={[{ title: "Party", hintText: "Select party" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }, { title: "Valid Until", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/saleOrder": () => <GenericTransactionScreen title="Sale Order" />,
  "/addSaleOrder": () => <AddFormScreen title="Add Sale Order" submitLabel="Save Order" fields={[{ title: "Party", hintText: "Select party" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/salesInvoice": () => <GenericTransactionScreen title="Sales Invoice" />,
  "/addSalesInvoice": () => <AddFormScreen title="Add Sales Invoice" submitLabel="Save Invoice" fields={[{ title: "Party", hintText: "Select party" }, { title: "Invoice Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/paymentIn": () => <GenericTransactionScreen title="Payment In" />,
  "/addPaymentIn": () => <AddFormScreen title="Add Payment In" submitLabel="Save Payment" fields={[{ title: "Party", hintText: "Select party" }, { title: "Amount", hintText: "0.00" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/salesReturn": () => <GenericTransactionScreen title="Sales Return" />,
  "/addSalesReturn": () => <AddFormScreen title="Add Sales Return" submitLabel="Save Return" fields={[{ title: "Party", hintText: "Select party" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
  "/deliveryNote": () => <GenericTransactionScreen title="Delivery Note" />,
  "/addDeliveryNote": () => <AddFormScreen title="Add Delivery Note" submitLabel="Save" fields={[{ title: "Party", hintText: "Select party" }, { title: "Date", hintText: "dd/mm/yyyy", isDate: true }]} />,
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
  "/generalSettings": () => <AddFormScreen title="General Settings" submitLabel="Save" fields={[{ title: "Currency", hintText: "PKR" }, { title: "Date Format", hintText: "dd/MM/yyyy" }, { title: "Decimal Places", hintText: "2" }]} />,
  "/transactionSettings": () => <AddFormScreen title="Transaction Settings" submitLabel="Save" fields={[{ title: "Enable GST", hintText: "Yes/No" }, { title: "Default Tax Rate", hintText: "0%" }]} />,
  "/invoicePrint": () => <AddFormScreen title="Invoice Print" submitLabel="Save" fields={[{ title: "Paper Size", hintText: "A4" }, { title: "Header Text", hintText: "Enter header" }]} />,
  "/taxes": () => <AddFormScreen title="Taxes" submitLabel="Save" fields={[{ title: "Tax Name", hintText: "GST" }, { title: "Tax Rate", hintText: "17%" }]} />,
  "/reminders": () => <AddFormScreen title="Reminders" submitLabel="Save" fields={[{ title: "Payment Reminder", hintText: "Days before due" }, { title: "Low Stock Alert", hintText: "Threshold qty" }]} />,
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
