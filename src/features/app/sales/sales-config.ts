import type { SalesDocType } from "@/services/sales-api";
import { RouteName } from "@/constants/routes";

export type SalesModuleConfig = {
  docType: SalesDocType;
  title: string;
  addTitle: string;
  route: string;
  addRoute: string;
  docNoLabel?: string;
  dueDateLabel?: string;
  statuses: string[];
  showItems: boolean;
  showPartyDetails?: boolean;
  showPaymentFields?: boolean;
  showDeliveryFields?: boolean;
  showReturnReason?: boolean;
  showLinkedInvoice?: boolean;
  convertTargets?: Array<{ label: string; target: SalesDocType; route: string }>;
  /** Party dropdown hint, e.g. "Select customer" / "Select supplier". */
  partyHint?: string;
  /** Document type offered in the "Linked ..." dropdown (payments and returns). */
  linkedDocType?: SalesDocType;
  linkedLabel?: string;
  /** Item price copied into a new line. */
  priceField?: "sale_price" | "purchase_price";
  /** Card menu shortcuts. */
  paymentRoute?: string;
  returnRoute?: string;
};

export const SALES_MODULES: Record<string, SalesModuleConfig> = {
  quotation: {
    docType: "quotation",
    title: "Estimate / Quotation",
    addTitle: "Add Quotation",
    route: RouteName.quotation,
    addRoute: RouteName.addQuotation,
    docNoLabel: "Quotation No.",
    dueDateLabel: "Valid Until",
    statuses: ["draft", "sent", "approved", "rejected", "expired"],
    showItems: true,
    showPartyDetails: true,
    convertTargets: [
      { label: "Sales Order", target: "sale_order", route: RouteName.saleOrder },
      { label: "Invoice", target: "sales_invoice", route: RouteName.salesInvoice },
    ],
  },
  sale_order: {
    docType: "sale_order",
    title: "Sales Order",
    addTitle: "Add Sales Order",
    route: RouteName.saleOrder,
    addRoute: RouteName.addSaleOrder,
    docNoLabel: "Order No.",
    dueDateLabel: "Expected Delivery",
    statuses: ["open", "partial", "completed", "cancelled"],
    showItems: true,
    showPartyDetails: true,
    paymentRoute: RouteName.paymentIn,
    returnRoute: RouteName.salesReturn,
    convertTargets: [
      { label: "Convert to Delivery Note", target: "delivery_note", route: RouteName.deliveryNote },
      { label: "Convert to Invoice", target: "sales_invoice", route: RouteName.salesInvoice },
    ],
  },
  sales_invoice: {
    docType: "sales_invoice",
    title: "Sales Invoice",
    addTitle: "Add Sales Invoice",
    route: RouteName.salesInvoice,
    addRoute: RouteName.addSalesInvoice,
    docNoLabel: "Invoice No.",
    dueDateLabel: "Due Date",
    statuses: ["unpaid", "partial", "paid", "cancelled"],
    showItems: true,
    showPartyDetails: true,
    paymentRoute: RouteName.paymentIn,
    returnRoute: RouteName.salesReturn,
  },
  payment_in: {
    docType: "payment_in",
    title: "Payment In",
    addTitle: "Add Payment In",
    route: RouteName.paymentIn,
    addRoute: RouteName.addPaymentIn,
    docNoLabel: "Receipt No.",
    statuses: ["received", "cancelled"],
    showItems: false,
    showPaymentFields: true,
    showLinkedInvoice: true,
    linkedDocType: "sales_invoice",
    showPartyDetails: true,
  },
  sales_return: {
    docType: "sales_return",
    title: "Sales Return",
    addTitle: "Add Sales Return",
    route: RouteName.salesReturn,
    addRoute: RouteName.addSalesReturn,
    docNoLabel: "Return No.",
    statuses: ["draft", "completed", "cancelled"],
    showItems: true,
    showReturnReason: true,
    showLinkedInvoice: true,
    linkedDocType: "sales_invoice",
    showPartyDetails: true,
  },
  delivery_note: {
    docType: "delivery_note",
    title: "Delivery Note",
    addTitle: "Add Delivery Note",
    route: RouteName.deliveryNote,
    addRoute: RouteName.addDeliveryNote,
    docNoLabel: "Delivery No.",
    statuses: ["pending", "delivered", "cancelled"],
    showItems: true,
    showDeliveryFields: true,
    showPartyDetails: true,
    convertTargets: [
      { label: "Convert to Invoice", target: "sales_invoice", route: RouteName.salesInvoice },
    ],
  },
  purchase_order: {
    docType: "purchase_order",
    title: "Purchase Order",
    addTitle: "Add Purchase Order",
    route: RouteName.purchaseOrder,
    addRoute: RouteName.addPurchaseOrder,
    docNoLabel: "Order No.",
    dueDateLabel: "Expected Delivery",
    statuses: ["open", "partial", "completed", "cancelled"],
    showItems: true,
    showPartyDetails: true,
    partyHint: "Select supplier",
    priceField: "purchase_price",
    convertTargets: [
      { label: "Convert to Purchase Bill", target: "purchase_bill", route: RouteName.purchaseBill },
    ],
  },
  purchase_bill: {
    docType: "purchase_bill",
    title: "Purchase Bill",
    addTitle: "Add Purchase Bill",
    route: RouteName.purchaseBill,
    addRoute: RouteName.addPurchaseBill,
    docNoLabel: "Bill No.",
    dueDateLabel: "Due Date",
    statuses: ["unpaid", "partial", "paid", "cancelled"],
    showItems: true,
    showPartyDetails: true,
    partyHint: "Select supplier",
    priceField: "purchase_price",
    paymentRoute: RouteName.paymentOut,
    returnRoute: RouteName.purchaseReturn,
  },
  payment_out: {
    docType: "payment_out",
    title: "Payment Out",
    addTitle: "Add Payment Out",
    route: RouteName.paymentOut,
    addRoute: RouteName.addPaymentOut,
    docNoLabel: "Payment No.",
    statuses: ["paid", "cancelled"],
    showItems: false,
    showPaymentFields: true,
    showLinkedInvoice: true,
    linkedDocType: "purchase_bill",
    linkedLabel: "Linked Bill",
    showPartyDetails: true,
    partyHint: "Select supplier",
  },
  purchase_return: {
    docType: "purchase_return",
    title: "Purchase Return",
    addTitle: "Add Purchase Return",
    route: RouteName.purchaseReturn,
    addRoute: RouteName.addPurchaseReturn,
    docNoLabel: "Return No.",
    statuses: ["draft", "completed", "cancelled"],
    showItems: true,
    showReturnReason: true,
    showLinkedInvoice: true,
    linkedDocType: "purchase_bill",
    linkedLabel: "Linked Bill",
    showPartyDetails: true,
    partyHint: "Select supplier",
    priceField: "purchase_price",
  },
};
