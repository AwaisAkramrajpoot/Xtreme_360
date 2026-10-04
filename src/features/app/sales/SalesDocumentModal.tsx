"use client";

import { useEffect, useMemo, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { NewItemModal } from "@/components/modals/NewItemModal";
import { AppColors } from "@/constants/colors";
import { getParties, type PartyRecord } from "@/services/party-api";
import { getItems, type ItemRecord } from "@/services/item-api";
import { getAccounts } from "@/services/cash-bank-api";
import {
  createSalesDocument,
  getNextSalesDocNo,
  getSalesDocuments,
  updateSalesDocument,
  type SalesDocument,
  type SalesDocPayload,
} from "@/services/sales-api";
import { getApiErrorMessage } from "@/utils/api-error";
import type { SalesModuleConfig } from "./sales-config";
import { useSettingsStore } from "@/stores/settings-store";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { formatMoney, type PartySettings } from "@/constants/app-settings";

type LineDraft = {
  key: string;
  itemId: number | null;
  itemName: string;
  itemCode: string;
  unit: string;
  quantity: string;
  rate: string;
  discount: string;
  taxPercent: string;
  reason: string;
  orderedQty: string;
};

function emptyLine(): LineDraft {
  return {
    key: `${Date.now()}-${Math.random()}`,
    itemId: null,
    itemName: "",
    itemCode: "",
    unit: "",
    quantity: "1",
    rate: "0",
    discount: "0",
    taxPercent: "0",
    reason: "",
    orderedQty: "",
  };
}

function lineAmount(
  line: LineDraft,
  options: { enableTax: boolean; enableDiscount: boolean }
) {
  const qty = Number(line.quantity) || 0;
  const rate = Number(line.rate) || 0;
  const discount = options.enableDiscount ? Number(line.discount) || 0 : 0;
  const taxPercent = options.enableTax ? Number(line.taxPercent) || 0 : 0;
  const base = Math.max(qty * rate - discount, 0);
  return base + (base * taxPercent) / 100;
}

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function partyDetailRows(party: PartyRecord | null, partySettings: PartySettings) {
  if (!party) return [];
  const rows: Array<{ label: string; value: string }> = [
    { label: "Party Name", value: party.party_name || "" },
    { label: "Type", value: party.party_type || "" },
    { label: "Category", value: party.party_category || "" },
    { label: "Phone", value: party.mobile_number || "" },
    { label: "Emergency", value: party.emergency_number || "" },
    { label: "Address", value: party.address || "" },
    { label: "City", value: party.city || "" },
    { label: "Area", value: party.area || "" },
    { label: "Zone", value: party.zone || "" },
    { label: "Country", value: party.country || "" },
    { label: "CNC / NTN", value: party.cnc_number || "" },
    { label: "NTN", value: partySettings.tinNumber ? party.tin_number || "" : "" },
    {
      label: "Shipping Address",
      value: partySettings.partyShippingAddress ? party.shipping_address || "" : "",
    },
    {
      label: "Opening Balance",
      value:
        party.opening_balance != null && String(party.opening_balance).trim() !== ""
          ? String(party.opening_balance)
          : "",
    },
  ];
  return rows.filter((row) => row.value.trim() !== "");
}

interface SalesDocumentModalProps {
  open: boolean;
  onClose: () => void;
  config: SalesModuleConfig;
  initial?: SalesDocument | null;
  onSaved: () => void;
}

export function SalesDocumentModal({
  open,
  onClose,
  config,
  initial,
  onSaved,
}: SalesDocumentModalProps) {
  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  /** Line whose item picker opened "Add New Item"; the new item is filled into it. */
  const [newItemForLine, setNewItemForLine] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<SalesDocument[]>([]);
  const [bankAccountNames, setBankAccountNames] = useState<string[]>([]);
  const [partyKey, setPartyKey] = useState<string | null>(null);
  const [docNo, setDocNo] = useState("");
  const [docDate, setDocDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState(config.statuses[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [bankAccount, setBankAccount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedInvoiceKey, setLinkedInvoiceKey] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [transporter, setTransporter] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enableTax = useSettingsStore((s) => s.enableTax);
  const enableDiscount = useSettingsStore((s) => s.enableDiscount);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const general = useSettingsStore((s) => s.app.general);
  const transaction = useSettingsStore((s) => s.app.transaction);
  const cashSaleByDefault = transaction.cashSaleByDefault;
  const partySettings = useSettingsStore((s) => s.app.party);
  const { confirm } = useConfirm();
  const money = (value: number) => formatMoney(value, general);

  const docNoLabel = config.docNoLabel || "Document No";
  const isQuotation = config.docType === "quotation";
  const calcOptions = { enableTax, enableDiscount };

  const partyOptions = useMemo(
    () => parties.map((p) => `${p.id}::${p.party_name}`),
    [parties]
  );
  const itemOptions = useMemo(
    () => items.map((i) => `${i.id}::${i.item_name}`),
    [items]
  );
  const invoiceOptions = useMemo(
    () =>
      invoices.map(
        (inv) =>
          `${inv.id}::${inv.doc_no || `#${inv.id}`} — ${inv.party_name || "Party"} (Bal: ${inv.balance_due ?? inv.total_amount ?? 0})`
      ),
    [invoices]
  );

  const selectedParty = useMemo(() => {
    if (!partyKey) return null;
    const idStr = partyKey.split("::")[0];
    return parties.find((p) => String(p.id) === idStr) || null;
  }, [partyKey, parties]);

  const partyInfo = useMemo(
    () => partyDetailRows(selectedParty, partySettings),
    [selectedParty, partySettings]
  );

  const totals = useMemo(() => {
    if (!config.showItems) {
      const total = Number(amount) || 0;
      return { subtotal: 0, discount: 0, tax: 0, total };
    }
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let total = 0;
    for (const line of lines) {
      const qty = Number(line.quantity) || 0;
      const rate = Number(line.rate) || 0;
      const disc = enableDiscount ? Number(line.discount) || 0 : 0;
      const taxPercent = enableTax ? Number(line.taxPercent) || 0 : 0;
      const base = Math.max(qty * rate - disc, 0);
      const taxAmt = (base * taxPercent) / 100;
      subtotal += qty * rate;
      discount += disc;
      tax += taxAmt;
      total += base + taxAmt;
    }
    return { subtotal, discount, tax, total };
  }, [amount, config.showItems, enableDiscount, enableTax, lines]);

  // Transaction › Show profit: margin over item purchase prices, before tax.
  const profit = useMemo(() => {
    if (!transaction.showProfit || config.docType !== "sales_invoice" || !config.showItems) return null;
    let value = 0;
    for (const line of lines) {
      if (!line.itemName.trim()) continue;
      const qty = Number(line.quantity) || 0;
      const disc = enableDiscount ? Number(line.discount) || 0 : 0;
      const cost = Number(items.find((i) => i.id === line.itemId)?.purchase_price) || 0;
      value += qty * (Number(line.rate) || 0) - disc - qty * cost;
    }
    return value;
  }, [transaction.showProfit, config.docType, config.showItems, lines, items, enableDiscount]);

  // Snapshot of every editable field, used by General › "Show warning for unsaved changes".
  const formSnapshot = JSON.stringify({
    partyKey,
    docNo,
    docDate,
    dueDate,
    status,
    notes,
    terms,
    paymentMode,
    bankAccount,
    referenceNo,
    amount,
    linkedInvoice: linkedInvoiceKey?.split("::")[0] ?? null,
    deliveryAddress,
    transporter,
    vehicleNo,
    lines: lines.map((line) => ({ ...line, key: undefined })),
  });
  const [baseline, setBaseline] = useState<string | null>(null);
  const [baselinePending, setBaselinePending] = useState(false);
  // Capture the freshly initialised form as the baseline (state adjusted during render).
  if (baselinePending) {
    setBaselinePending(false);
    setBaseline(formSnapshot);
  }
  const isDirty = baseline !== null && baseline !== formSnapshot;

  const requestClose = async () => {
    if (loading) return;
    if (general.showUnsavedWarning && isDirty) {
      const ok = await confirm({
        title: "Discard changes?",
        message: "You have unsaved changes. Close without saving?",
        confirmLabel: "Discard",
        danger: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    if (!settingsLoaded) {
      loadSettings().catch(() => undefined);
    }
  }, [open, settingsLoaded, loadSettings]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [partyList, itemList] = await Promise.all([getParties(), getItems()]);
        if (cancelled) return;
        setParties(partyList);
        setItems(itemList);
        if (config.showPaymentFields) {
          // Non-cash payments post to one of these accounts (Cash & Bank balances use it).
          const accounts = await getAccounts("bank").catch(() => []);
          if (!cancelled) setBankAccountNames(accounts.map((a) => a.account_name));
        }
        if (config.showLinkedInvoice) {
          const inv = await getSalesDocuments(config.linkedDocType ?? "sales_invoice");
          if (!cancelled) setInvoices(inv);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, "Failed to load lookups"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, config.showLinkedInvoice, config.linkedDocType, config.showPaymentFields]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setBaseline(null);
      if (initial) {
        setDocNo(initial.doc_no || "");
        setDocDate((initial.doc_date || today()).toString().slice(0, 10));
        setDueDate(initial.due_date ? String(initial.due_date).slice(0, 10) : "");
        setStatus(initial.status || config.statuses[0]);
        setNotes(initial.notes || "");
        setTerms(initial.terms || "");
        setPaymentMode(initial.payment_mode || "Cash");
        setBankAccount(initial.bank_account || "");
        setReferenceNo(initial.reference_no || "");
        setAmount(String(initial.total_amount ?? ""));
        setDeliveryAddress(initial.delivery_address || "");
        setTransporter(initial.transporter || "");
        setVehicleNo(initial.vehicle_no || "");
        setPartyKey(
          initial.party_id ? `${initial.party_id}::${initial.party_name || ""}` : null
        );
        setLinkedInvoiceKey(
          initial.linked_invoice_id ? String(initial.linked_invoice_id) : null
        );
        setLines(
          (initial.items || []).length
            ? (initial.items || []).map((item) => ({
                key: `${item.id || Math.random()}`,
                itemId: item.item_id ?? null,
                itemName: item.item_name,
                itemCode: item.item_code || "",
                unit: item.unit || "",
                quantity: String(item.quantity ?? 1),
                rate: String(item.rate ?? 0),
                discount: String(item.discount ?? 0),
                taxPercent: String(item.tax_percent ?? 0),
                reason: item.reason || "",
                orderedQty: item.ordered_qty != null ? String(item.ordered_qty) : "",
              }))
            : [emptyLine()]
        );
      } else {
        setDocDate(today());
        setDueDate("");
        // Transaction › Cash sale by default: new invoices start as paid.
        setStatus(
          cashSaleByDefault && config.docType === "sales_invoice" && config.statuses.includes("paid")
            ? "paid"
            : config.statuses[0]
        );
        setNotes("");
        setTerms("");
        setPaymentMode("Cash");
        setBankAccount("");
        setReferenceNo("");
        setAmount("");
        setDeliveryAddress("");
        setTransporter("");
        setVehicleNo("");
        setPartyKey(null);
        setLinkedInvoiceKey(null);
        setLines([emptyLine()]);
        try {
          const nextNo = await getNextSalesDocNo(config.docType);
          if (!cancelled) setDocNo(nextNo);
        } catch {
          if (!cancelled) setDocNo("");
        }
      }
      if (!cancelled) {
        setError("");
        setBaselinePending(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // cashSaleByDefault is read once when the form opens; toggling it later must not reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, config.statuses, config.docType]);

  useEffect(() => {
    if (!open || !initial?.linked_invoice_id || !invoices.length) return;
    const match = invoices.find((inv) => inv.id === initial.linked_invoice_id);
    if (match) {
      setLinkedInvoiceKey(
        `${match.id}::${match.doc_no || `#${match.id}`} — ${match.party_name || "Party"} (Bal: ${match.balance_due ?? match.total_amount ?? 0})`
      );
    }
  }, [open, initial, invoices]);

  const onPickParty = (value: string) => {
    setPartyKey(value);
    // Party Settings › Shipping address: prefill the delivery address for delivery notes.
    if (config.showDeliveryFields && partySettings.partyShippingAddress && !deliveryAddress.trim()) {
      const party = parties.find((p) => String(p.id) === value.split("::")[0]);
      const address = party?.shipping_address || party?.address || "";
      if (address) setDeliveryAddress(address);
    }
  };

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const onItemCreated = (item: ItemRecord) => {
    setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    if (newItemForLine) {
      updateLine(newItemForLine, {
        itemId: item.id,
        itemName: item.item_name,
        itemCode: item.item_code || "",
        unit: item.item_unit || "",
        rate: String(item[config.priceField ?? "sale_price"] ?? 0),
      });
    }
  };

  const onPickItem = (key: string, value: string) => {
    const [idStr, ...nameParts] = value.split("::");
    const item = items.find((i) => String(i.id) === idStr);
    updateLine(key, {
      itemId: item?.id ?? (Number(idStr) || null),
      itemName: item?.item_name || nameParts.join("::"),
      itemCode: item?.item_code || "",
      unit: item?.item_unit || "",
      rate: String(item?.[config.priceField ?? "sale_price"] ?? 0),
    });
  };

  const handleSave = async () => {
    setError("");
    if (!partyKey) {
      setError("Please select a party");
      return;
    }
    const [partyIdStr, ...partyNameParts] = partyKey.split("::");
    const partyId = Number(partyIdStr) || null;
    const partyName = partyNameParts.join("::");

    if (config.showItems) {
      const validLines = lines.filter((l) => l.itemName.trim());
      if (!validLines.length) {
        setError("Add at least one item");
        return;
      }
    } else if (!(Number(amount) > 0)) {
      setError("Enter a valid amount");
      return;
    }

    if (!docNo.trim()) {
      setError(`${docNoLabel} is required`);
      return;
    }

    const payload: SalesDocPayload = {
      docNo: docNo.trim(),
      partyId,
      partyName,
      docDate,
      dueDate: dueDate || undefined,
      status,
      notes,
      terms,
      paymentMode: config.showPaymentFields ? paymentMode : undefined,
      bankAccount: config.showPaymentFields && paymentMode !== "Cash" ? bankAccount : undefined,
      referenceNo: config.showPaymentFields ? referenceNo : undefined,
      deliveryAddress: config.showDeliveryFields ? deliveryAddress : undefined,
      transporter: config.showDeliveryFields ? transporter : undefined,
      vehicleNo: config.showDeliveryFields ? vehicleNo : undefined,
      totalAmount: config.showItems ? undefined : Number(amount) || 0,
      linkedInvoiceId: linkedInvoiceKey
        ? Number(linkedInvoiceKey.split("::")[0]) || null
        : null,
      items: config.showItems
        ? lines
            .filter((l) => l.itemName.trim())
            .map((l) => ({
              itemId: l.itemId,
              itemName: l.itemName,
              itemCode: l.itemCode,
              unit: l.unit,
              quantity: Number(l.quantity) || 0,
              rate: Number(l.rate) || 0,
              discount: enableDiscount ? Number(l.discount) || 0 : 0,
              taxPercent: enableTax ? Number(l.taxPercent) || 0 : 0,
              reason: config.showReturnReason ? l.reason : undefined,
              orderedQty: l.orderedQty ? Number(l.orderedQty) : undefined,
            }))
        : [],
    };

    setLoading(true);
    try {
      if (initial?.id) {
        await updateSalesDocument(config.docType, initial.id, payload);
      } else {
        await createSalesDocument(config.docType, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save document"));
    } finally {
      setLoading(false);
    }
  };

  const totalsBlock = (
    <div
      className="rounded-xl border p-4 space-y-2 text-sm"
      style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
    >
          {config.showItems && (
            <>
              <div className="flex justify-between gap-4">
                <span style={{ color: AppColors.grey }}>Subtotal</span>
                <b>{money(totals.subtotal)}</b>
              </div>
              {enableDiscount && (
                <div className="flex justify-between gap-4">
                  <span style={{ color: AppColors.grey }}>Discount</span>
                  <b>{money(totals.discount)}</b>
                </div>
              )}
              {enableTax && (
                <div className="flex justify-between gap-4">
                  <span style={{ color: AppColors.grey }}>Tax</span>
                  <b>{money(totals.tax)}</b>
                </div>
              )}
              <div className="h-px" style={{ backgroundColor: AppColors.lightGrey }} />
            </>
          )}
      <div className="flex justify-between gap-4 text-base">
        <span className="font-semibold">Grand Total</span>
        <b>{money(totals.total)}</b>
      </div>
      {profit !== null && (
        <div className="flex justify-between gap-4 text-sm">
          <span style={{ color: AppColors.grey }}>Estimated Profit</span>
          <b style={{ color: profit >= 0 ? AppColors.primary : "#D64545" }}>{money(profit)}</b>
        </div>
      )}
    </div>
  );

  return (
    <AppModal
      open={open}
      onClose={() => void requestClose()}
      title={initial ? `Edit ${config.title}` : config.addTitle}
      size="xl"
      footer={
        <FormButtonsRow
          onCancel={() => void requestClose()}
          onSave={handleSave}
          saveLabel={initial ? "Update" : isQuotation ? "Save Quotation" : "Save"}
          isLoading={loading}
        />
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Row 1: Date / Valid Until */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppTextField title="Date" hintText="yyyy-mm-dd" value={docDate} onChange={setDocDate} isDateField />
          {config.dueDateLabel ? (
            <AppTextField
              title={config.dueDateLabel}
              hintText="yyyy-mm-dd"
              value={dueDate}
              onChange={setDueDate}
              isDateField
            />
          ) : (
            <AppDropDown
              title="Status"
              items={config.statuses}
              value={status}
              onChange={setStatus}
              hintText="Select status"
            />
          )}
        </div>

        {/* Row 2: Party / Quotation No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppDropDown
            title="Party"
            items={partyOptions}
            value={partyKey}
            onChange={onPickParty}
            hintText={config.partyHint ?? "Select customer"}
            getLabel={(v) => v.split("::").slice(1).join("::")}
          />
          {/* Transaction › Invoice/Bill number: the number is still assigned automatically when hidden. */}
          {(transaction.invoiceBillNo || !docNo.trim()) && (
            <AppTextField
              title={docNoLabel}
              hintText="e.g. QT-00001"
              value={docNo}
              onChange={setDocNo}
            />
          )}
        </div>

        {/* Status + linked invoice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.dueDateLabel && (
            <AppDropDown
              title="Status"
              items={config.statuses}
              value={status}
              onChange={setStatus}
              hintText="Select status"
            />
          )}
          {config.showLinkedInvoice && (
            <AppDropDown
              title={config.linkedLabel ?? "Linked Invoice"}
              items={invoiceOptions}
              value={linkedInvoiceKey}
              onChange={setLinkedInvoiceKey}
              hintText="Select invoice"
              getLabel={(v) => v.split("::").slice(1).join("::")}
            />
          )}
        </div>

        {config.showPartyDetails && partyInfo.length > 0 && (
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: AppColors.lightGrey, backgroundColor: "#FAFBFC" }}
          >
            <h3 className="text-sm font-semibold text-black mb-3">Selected Party Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {partyInfo.map((row) => (
                <div key={row.label} className="flex gap-2 min-w-0">
                  <span className="shrink-0" style={{ color: AppColors.grey }}>
                    {row.label}:
                  </span>
                  <span className="font-medium text-black truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.showPaymentFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppTextField title="Amount" hintText="0.00" value={amount} onChange={setAmount} />
            <AppDropDown
              title="Payment Mode"
              items={["Cash", "Bank", "Cheque", "Online"]}
              value={paymentMode}
              onChange={setPaymentMode}
            />
            {paymentMode === "Cash" ? (
              <AppTextField title="Account" value="Cash in hand" onChange={() => undefined} readOnly />
            ) : bankAccountNames.length ? (
              <AppDropDown
                title="Bank Account"
                items={Array.from(new Set([...bankAccountNames, ...(bankAccount ? [bankAccount] : [])]))}
                value={bankAccount || null}
                onChange={setBankAccount}
                hintText="Select bank account"
              />
            ) : (
              <AppTextField title="Bank Account" hintText="Add accounts in Cash & Bank" value={bankAccount} onChange={setBankAccount} />
            )}
            <AppTextField title="Reference / Receipt No" hintText="Optional" value={referenceNo} onChange={setReferenceNo} />
          </div>
        )}

        {config.showDeliveryFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppTextField
              title="Delivery Address"
              hintText="Address"
              value={deliveryAddress}
              onChange={setDeliveryAddress}
              maxLines={2}
            />
            <AppTextField title="Transporter" hintText="Optional" value={transporter} onChange={setTransporter} />
            <AppTextField title="Vehicle No" hintText="Optional" value={vehicleNo} onChange={setVehicleNo} />
          </div>
        )}

        {config.showItems && (
          <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: AppColors.lightGrey }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-black">
                {isQuotation ? "Quotation Items" : "Items"}
              </h3>
              <button
                type="button"
                className="text-sm font-medium"
                style={{ color: AppColors.primary }}
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg bg-[#F8F9FB] p-3"
                >
                  <div className="md:col-span-3">
                    <AppDropDown
                      title="Item"
                      items={itemOptions}
                      value={line.itemId ? `${line.itemId}::${line.itemName}` : null}
                      onChange={(v) => onPickItem(line.key, v)}
                      hintText="Select item"
                      getLabel={(v) => v.split("::").slice(1).join("::")}
                      emptyText="No items yet"
                      actionLabel="Add New Item"
                      onAction={() => setNewItemForLine(line.key)}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <AppTextField
                      title="Qty"
                      hintText="1"
                      value={line.quantity}
                      onChange={(v) => updateLine(line.key, { quantity: v })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <AppTextField
                      title="Rate"
                      hintText="0"
                      value={line.rate}
                      onChange={(v) => updateLine(line.key, { rate: v })}
                    />
                  </div>
                  {enableDiscount && (
                    <div className="md:col-span-1">
                      <AppTextField
                        title="Disc"
                        hintText="0"
                        value={line.discount}
                        onChange={(v) => updateLine(line.key, { discount: v })}
                      />
                    </div>
                  )}
                  {enableTax && (
                    <div className="md:col-span-1">
                      <AppTextField
                        title="Tax %"
                        hintText="0"
                        value={line.taxPercent}
                        onChange={(v) => updateLine(line.key, { taxPercent: v })}
                      />
                    </div>
                  )}
                  <div className={enableTax || enableDiscount ? "md:col-span-2" : "md:col-span-4"}>
                    <AppTextField
                      title="Amount"
                      hintText="0"
                      value={lineAmount(line, calcOptions).toFixed(general.decimalPlaces)}
                      onChange={() => undefined}
                      readOnly
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    {config.showReturnReason && (
                      <div className="flex-1">
                        <AppTextField
                          title="Reason"
                          hintText="Reason"
                          value={line.reason}
                          onChange={(v) => updateLine(line.key, { reason: v })}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      className="h-12 px-2 text-red-500"
                      onClick={() =>
                        setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== line.key) : prev))
                      }
                      aria-label="Remove item"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                  {transaction.displayPurchasePrice && line.itemId && (
                    <p className="md:col-span-12 text-xs" style={{ color: AppColors.grey }}>
                      Purchase price:{" "}
                      {money(Number(items.find((i) => i.id === line.itemId)?.purchase_price) || 0)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations immediately below items */}
            {totalsBlock}
          </div>
        )}

        {!config.showItems && totalsBlock}

        <div className="space-y-4">
          <AppTextField title="Notes" hintText="Optional notes" value={notes} onChange={setNotes} maxLines={3} />
          {!config.showPaymentFields && (
            <AppTextField
              title="Terms & Conditions"
              hintText="Optional terms"
              value={terms}
              onChange={setTerms}
              maxLines={3}
            />
          )}
        </div>
      </div>
      <NewItemModal
        open={newItemForLine !== null}
        onClose={() => setNewItemForLine(null)}
        onCreated={onItemCreated}
      />
    </AppModal>
  );
}
