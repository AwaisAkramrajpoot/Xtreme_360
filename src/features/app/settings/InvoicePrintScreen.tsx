"use client";

import { useState } from "react";
import type { InvoicePrintSettings, PrinterType } from "@/constants/app-settings";
import { useSettingsStore } from "@/stores/settings-store";
import {
  SettingsLayout,
  SettingsLinkRow,
  SettingsNote,
  SettingsSection,
  SettingsSegmented,
  SettingsStepperRow,
  SettingsToggleRow,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

const PRINTER_TYPES: readonly PrinterType[] = ["Regular", "Thermal"];

type ToggleKey = {
  [K in keyof InvoicePrintSettings]: InvoicePrintSettings[K] extends boolean ? K : never;
}[keyof InvoicePrintSettings];

function InvoicePrintContent({ mode }: { mode: PrinterType }) {
  const { values, update, isBusy } = useSettingsSection("invoicePrint");
  const { notify } = useSettingsScreen();
  const comingSoon = () => notify("This option is coming soon");
  const regular = mode === "Regular";

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
      <SettingsSection title="Printer" icon={regular ? "print" : "receipt"}>
        <SettingsToggleRow
          label={`Make ${mode} printer default`}
          description={
            regular
              ? "Sales documents and POS bills print on A4 pages."
              : "Sales documents and POS bills print as 80 mm receipts."
          }
          value={values.defaultPrinter === mode}
          busy={isBusy("defaultPrinter")}
          onChange={(v) => void update("defaultPrinter", v ? mode : regular ? "Thermal" : "Regular")}
        />
        <SettingsStepperRow
          label="Number of copies"
          value={values.numberOfCopies}
          min={1}
          max={5}
          busy={isBusy("numberOfCopies")}
          onChange={(v) => void update("numberOfCopies", v)}
        />
        {regular ? (
          <>
            <SettingsLinkRow label="Change theme and colors" onClick={comingSoon} />
            <SettingsLinkRow label="Page size" value="A4 (210 × 297 mm)" onClick={comingSoon} />
          </>
        ) : (
          <>
            <SettingsLinkRow label="Thermal printer page size" value="3 inch (80 mm)" onClick={comingSoon} />
            <SettingsStepperRow
              label="Extra lines at print end"
              value={values.extraLinesEnd}
              min={0}
              max={10}
              busy={isBusy("extraLinesEnd")}
              onChange={(v) => void update("extraLinesEnd", v)}
            />
            {toggle("textStyling", "Use text styling (bold)", "Print headings and totals in bold.")}
            {toggle("nativeLanguage", "Native language printing")}
            {toggle("autoCutPaper", "Auto cut paper after printing")}
            {toggle("openCashDrawer", "Open cash drawer after printing")}
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Company Info / Header" icon="storefront" description="Taken from your Business Detail">
        {regular && toggle("printRepeatHeader", "Repeat header on all pages")}
        {toggle("printCompanyName", "Company name")}
        {toggle("companyLogo", "Company logo")}
        {toggle("address", "Address")}
        {toggle("email", "Email")}
        {toggle("phone", "Phone number")}
        {toggle("tinOnSale", "Party NTN on sale", "Print the party's NTN number on sales documents.")}
        {regular && (
          <>
            <SettingsStepperRow
              label="Extra space on top"
              description="Blank lines above the header, e.g. for letterhead paper."
              value={values.extraSpaceTop}
              min={0}
              max={10}
              busy={isBusy("extraSpaceTop")}
              onChange={(v) => void update("extraSpaceTop", v)}
            />
            {toggle("printOriginalDuplicate", "Print original / duplicate", "Label copies as Original and Duplicate.")}
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Totals & Taxes" icon="functions">
        <SettingsStepperRow
          label="Minimum rows in item table"
          description="Pads the item table with empty rows."
          value={values.minRowsItemTable}
          min={0}
          max={20}
          busy={isBusy("minRowsItemTable")}
          onChange={(v) => void update("minRowsItemTable", v)}
        />
        {toggle("totalItemQty", "Total item quantity")}
        {toggle("amountWithDecimal", "Amount with decimal (e.g. 0.00)")}
        {toggle("receivedAmount", "Received amount")}
        {toggle("balanceAmount", "Balance amount")}
        {toggle("partyCurrentBalance", "Current balance of party")}
        {toggle("taxDetails", "Tax details", "Print discount and tax lines in totals.")}
        {toggle("amountGrouping", "Amount grouping", "Use thousands separators, e.g. 1,000,000.")}
        {regular && toggle("youSaved", "You saved", "Show the total discount the customer received.")}
      </SettingsSection>

      <SettingsSection title="Footer" icon="edit_note">
        {toggle("printDescription", "Print description", "Print notes and terms.")}
        {toggle("paymentMode", "Payment mode")}
        {toggle("signatureText", "Signature text", "Add an authorised signatory line.")}
        {regular && (
          <>
            {toggle("receivedBy", "Received by details")}
            {toggle("deliveredBy", "Delivered by details")}
            {toggle("acknowledgment", "Print acknowledgment")}
          </>
        )}
        <SettingsNote>
          Company details come from Main Menu › Business Detail. Changes apply to the next print.
        </SettingsNote>
      </SettingsSection>
    </>
  );
}

export function InvoicePrintScreen() {
  const defaultPrinter = useSettingsStore((s) => s.app.invoicePrint.defaultPrinter);
  const [mode, setMode] = useState<PrinterType | null>(null);
  const activeMode = mode ?? defaultPrinter;

  return (
    <SettingsLayout
      title="Invoice Print"
      toolbar={<SettingsSegmented label="Printer type" options={PRINTER_TYPES} value={activeMode} onChange={setMode} />}
    >
      <InvoicePrintContent mode={activeMode} />
    </SettingsLayout>
  );
}
