import type { ItemSettings } from "@/constants/item-settings";
import { DEFAULT_ITEM_SETTINGS, mergeItemSettings } from "@/constants/item-settings";
import { RouteName } from "@/constants/routes";

/**
 * Every section below is persisted in `user_settings.settings_json.<section>` through
 * PATCH /settings/general. Defaults reproduce the app's behaviour before the setting existed,
 * so a user who never opens Settings sees no change.
 */

export type PartySettings = {
  tinNumber: boolean;
  partyGrouping: boolean;
  partyShippingAddress: boolean;
  inviteParties: boolean;
  loyaltyPoints: boolean;
};

export type GeneralUiSettings = {
  currency: string;
  decimalPlaces: number;
  dateFormat: string;
  themeStyle: string;
  /** First month (1-12) of the financial year. */
  fyStartMonth: number;
  showUnsavedWarning: boolean;
  estimateQuotation: boolean;
  proformaInvoice: boolean;
  otherIncome: boolean;
  salePurchaseOrder: boolean;
  fixedAssets: boolean;
  deliveryNote: boolean;
  goodReturnOnDeliveryNote: boolean;
  printAmountOnNote: boolean;
};

export type TransactionUiSettings = {
  invoiceBillNo: boolean;
  cashSaleByDefault: boolean;
  billingParty: boolean;
  poDetails: boolean;
  addTime: boolean;
  inclusiveTax: boolean;
  displayPurchasePrice: boolean;
  freeItemQty: boolean;
  roundOff: boolean;
  passcodeDelete: boolean;
  discountDuringPayment: boolean;
  invoicePreview: boolean;
  showProfit: boolean;
};

export type PrinterType = "Regular" | "Thermal";

export type InvoicePrintSettings = {
  defaultPrinter: PrinterType;
  printRepeatHeader: boolean;
  printCompanyName: boolean;
  companyLogo: boolean;
  address: boolean;
  email: boolean;
  phone: boolean;
  tinOnSale: boolean;
  printOriginalDuplicate: boolean;
  totalItemQty: boolean;
  amountWithDecimal: boolean;
  receivedAmount: boolean;
  balanceAmount: boolean;
  partyCurrentBalance: boolean;
  taxDetails: boolean;
  amountGrouping: boolean;
  youSaved: boolean;
  printDescription: boolean;
  receivedBy: boolean;
  deliveredBy: boolean;
  signatureText: boolean;
  paymentMode: boolean;
  acknowledgment: boolean;
  nativeLanguage: boolean;
  textStyling: boolean;
  autoCutPaper: boolean;
  openCashDrawer: boolean;
  extraSpaceTop: number;
  extraLinesEnd: number;
  numberOfCopies: number;
  minRowsItemTable: number;
};

export type ReminderSettings = {
  selfPaymentReminder: boolean;
  daysBeforeDue: number;
  reminderFrequency: string;
  partyPaymentReminder: boolean;
  serviceReminders: boolean;
};

export type HubSettings = {
  passcodeFingerprint: boolean;
  storeManagement: boolean;
  backupSettings: boolean;
};

export type PrefixOption = "None" | "Name";

export type PrefixSettings = {
  saleInvoice: PrefixOption;
  creditNote: PrefixOption;
  saleOrder: PrefixOption;
  purchaseOrder: PrefixOption;
  estimate: PrefixOption;
  deliveryNote: PrefixOption;
  paymentIn: PrefixOption;
};

export type TaxRate = { id: string; name: string; rate: number };

export type TaxSettings = {
  rates: TaxRate[];
};

export const DEFAULT_PARTY_SETTINGS: PartySettings = {
  tinNumber: true,
  partyGrouping: true,
  partyShippingAddress: true,
  inviteParties: false,
  loyaltyPoints: false,
};

export const DEFAULT_GENERAL_UI: GeneralUiSettings = {
  currency: "Rs",
  decimalPlaces: 2,
  dateFormat: "dd/mm/yyyy",
  themeStyle: "Modern",
  fyStartMonth: 7,
  showUnsavedWarning: true,
  estimateQuotation: true,
  proformaInvoice: false,
  otherIncome: true,
  salePurchaseOrder: true,
  fixedAssets: false,
  deliveryNote: true,
  goodReturnOnDeliveryNote: false,
  printAmountOnNote: true,
};

export const DEFAULT_TRANSACTION_UI: TransactionUiSettings = {
  invoiceBillNo: true,
  cashSaleByDefault: false,
  billingParty: false,
  poDetails: false,
  addTime: false,
  inclusiveTax: true,
  displayPurchasePrice: false,
  freeItemQty: false,
  roundOff: false,
  passcodeDelete: false,
  discountDuringPayment: false,
  invoicePreview: true,
  showProfit: false,
};

export const DEFAULT_INVOICE_PRINT: InvoicePrintSettings = {
  defaultPrinter: "Regular",
  printRepeatHeader: true,
  printCompanyName: true,
  companyLogo: true,
  address: true,
  email: false,
  phone: true,
  tinOnSale: false,
  printOriginalDuplicate: false,
  totalItemQty: true,
  amountWithDecimal: true,
  receivedAmount: true,
  balanceAmount: true,
  partyCurrentBalance: false,
  taxDetails: true,
  amountGrouping: true,
  youSaved: false,
  printDescription: true,
  receivedBy: false,
  deliveredBy: false,
  signatureText: false,
  paymentMode: true,
  acknowledgment: false,
  nativeLanguage: false,
  textStyling: true,
  autoCutPaper: false,
  openCashDrawer: false,
  extraSpaceTop: 0,
  extraLinesEnd: 0,
  numberOfCopies: 1,
  minRowsItemTable: 0,
};

export const DEFAULT_REMINDERS: ReminderSettings = {
  selfPaymentReminder: false,
  daysBeforeDue: 0,
  reminderFrequency: "Once a Day",
  partyPaymentReminder: false,
  serviceReminders: false,
};

export const DEFAULT_HUB: HubSettings = {
  passcodeFingerprint: false,
  storeManagement: false,
  backupSettings: true,
};

export const DEFAULT_PREFIXES: PrefixSettings = {
  saleInvoice: "None",
  creditNote: "None",
  saleOrder: "None",
  purchaseOrder: "None",
  estimate: "None",
  deliveryNote: "None",
  paymentIn: "None",
};

export const DEFAULT_TAXES: TaxSettings = {
  rates: [],
};

export function mergeSection<T extends object>(defaults: T, raw?: Partial<T> | null): T {
  return { ...defaults, ...(raw || {}) };
}

export type AppSettingsBundle = {
  item: ItemSettings;
  party: PartySettings;
  general: GeneralUiSettings;
  transaction: TransactionUiSettings;
  invoicePrint: InvoicePrintSettings;
  reminders: ReminderSettings;
  hub: HubSettings;
  prefixes: PrefixSettings;
  taxes: TaxSettings;
};

export type SettingsSectionKey = keyof AppSettingsBundle;

export const DEFAULT_APP_SETTINGS: AppSettingsBundle = {
  item: DEFAULT_ITEM_SETTINGS,
  party: DEFAULT_PARTY_SETTINGS,
  general: DEFAULT_GENERAL_UI,
  transaction: DEFAULT_TRANSACTION_UI,
  invoicePrint: DEFAULT_INVOICE_PRINT,
  reminders: DEFAULT_REMINDERS,
  hub: DEFAULT_HUB,
  prefixes: DEFAULT_PREFIXES,
  taxes: DEFAULT_TAXES,
};

export function mergeAppSettings(json?: Record<string, unknown> | null): AppSettingsBundle {
  const raw = json || {};
  const taxes = mergeSection(DEFAULT_TAXES, raw.taxes as Partial<TaxSettings>);
  return {
    item: mergeItemSettings(raw.item as Partial<ItemSettings>),
    party: mergeSection(DEFAULT_PARTY_SETTINGS, raw.party as Partial<PartySettings>),
    general: mergeSection(DEFAULT_GENERAL_UI, raw.general as Partial<GeneralUiSettings>),
    transaction: mergeSection(DEFAULT_TRANSACTION_UI, raw.transaction as Partial<TransactionUiSettings>),
    invoicePrint: mergeSection(DEFAULT_INVOICE_PRINT, raw.invoicePrint as Partial<InvoicePrintSettings>),
    reminders: mergeSection(DEFAULT_REMINDERS, raw.reminders as Partial<ReminderSettings>),
    hub: mergeSection(DEFAULT_HUB, raw.hub as Partial<HubSettings>),
    prefixes: mergeSection(DEFAULT_PREFIXES, raw.prefixes as Partial<PrefixSettings>),
    taxes: { rates: Array.isArray(taxes.rates) ? taxes.rates : [] },
  };
}

/**
 * Routes that the General > "More Transactions" toggles can hide from menus.
 * Routes not listed here are always visible.
 */
const ROUTE_FEATURE_FLAGS: Record<string, keyof GeneralUiSettings> = {
  [RouteName.quotation]: "estimateQuotation",
  [RouteName.saleOrder]: "salePurchaseOrder",
  [RouteName.purchaseOrder]: "salePurchaseOrder",
  [RouteName.deliveryNote]: "deliveryNote",
  [RouteName.otherIncome]: "otherIncome",
};

export function isRouteEnabled(href: string | undefined, general: GeneralUiSettings): boolean {
  if (!href) return true;
  const flag = ROUTE_FEATURE_FLAGS[href];
  return flag ? general[flag] !== false : true;
}

/** Formats an amount using General currency/decimal settings. */
export function formatMoney(
  value: number | string | null | undefined,
  general: Pick<GeneralUiSettings, "currency" | "decimalPlaces">,
  options: { grouping?: boolean; decimals?: boolean } = {}
) {
  const num = Number(value || 0);
  const digits = options.decimals === false ? 0 : general.decimalPlaces;
  const text = num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: options.grouping !== false,
  });
  return `${general.currency} ${text}`;
}

export { DEFAULT_ITEM_SETTINGS };
