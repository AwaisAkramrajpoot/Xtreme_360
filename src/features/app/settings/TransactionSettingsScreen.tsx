"use client";

import type { TransactionUiSettings } from "@/constants/app-settings";
import { useTaxDiscountToggles } from "./GeneralSettingsScreen";
import {
  SettingsLayout,
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

type ToggleKey = keyof TransactionUiSettings;

function TransactionSettingsContent() {
  const { values, update, isBusy } = useSettingsSection("transaction");
  // Barcode scanning is a single setting owned by Item settings.
  const item = useSettingsSection("item");
  const taxDiscount = useTaxDiscountToggles();
  const { notify } = useSettingsScreen();
  const comingSoon = () => notify("This option is coming soon");

  const toggle = (key: ToggleKey, label: string, description?: string) => (
    <SettingsToggleRow
      label={label}
      description={description}
      value={values[key]}
      busy={isBusy(key)}
      onChange={(v) => void update(key, v)}
    />
  );

  return (
    <>
      <SettingsSection title="Transaction Header" icon="description">
        {toggle("invoiceBillNo", "Invoice / Bill Number", "Show the document number field on sales forms.")}
        {toggle("cashSaleByDefault", "Cash sale by default", "New sales invoices start with status “paid”.")}
        {toggle("billingParty", "Billing name of parties")}
        {toggle("poDetails", "PO details (of customer)")}
        {toggle("addTime", "Add time on transaction", "Print the time a document was created.")}
      </SettingsSection>

      <SettingsSection title="Items Table" icon="table_rows">
        {toggle("inclusiveTax", "Allow inclusive / exclusive tax on rate")}
        {toggle("displayPurchasePrice", "Display purchase price", "Show each item's purchase price while adding it to a sale.")}
        {toggle("freeItemQty", "Free item quantity")}
        <SettingsToggleRow
          label="Barcode scanning for items"
          description="Same setting as Item Settings › Barcode scanning."
          value={item.values.barcodeScanning}
          busy={item.isBusy("barcodeScanning")}
          onChange={(v) => void item.update("barcodeScanning", v)}
        />
      </SettingsSection>

      <SettingsSection title="Taxes, Discount & Total" icon="calculate">
        <SettingsToggleRow
          label="Transaction wise tax"
          description="Same setting as General › Tax."
          value={taxDiscount.enableTax}
          busy={taxDiscount.taxBusy}
          onChange={taxDiscount.setTax}
        />
        <SettingsToggleRow
          label="Transaction wise discount"
          description="Same setting as General › Discount."
          value={taxDiscount.enableDiscount}
          busy={taxDiscount.discountBusy}
          onChange={taxDiscount.setDiscount}
        />
        {toggle("roundOff", "Round off transaction amount")}
      </SettingsSection>

      <SettingsSection title="More Transaction Features" icon="auto_awesome">
        <SettingsLinkRow label="Share transaction as" onClick={comingSoon} />
        {toggle("passcodeDelete", "Passcode for edit / delete")}
        {toggle("discountDuringPayment", "Discount during payment")}
        <SettingsLinkRow label="Due dates and payment terms" onClick={comingSoon} />
        {toggle("invoicePreview", "Enable invoice preview")}
        <SettingsLinkRow label="Additional fields" onClick={comingSoon} />
        <SettingsLinkRow label="Transportation details" onClick={comingSoon} />
        {toggle("showProfit", "Show profit while making sale invoice", "Estimated profit based on item purchase prices.")}
      </SettingsSection>
    </>
  );
}

export function TransactionSettingsScreen() {
  return (
    <SettingsLayout title="Transaction">
      <TransactionSettingsContent />
    </SettingsLayout>
  );
}
