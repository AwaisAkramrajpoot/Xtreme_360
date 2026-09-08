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
};
