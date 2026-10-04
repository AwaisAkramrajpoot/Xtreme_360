"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";
import type { GeneralUiSettings } from "@/constants/app-settings";
import {
  SettingsLayout,
  SettingsNote,
  SettingsSection,
  SettingsSelectRow,
  SettingsStepperRow,
  SettingsToggleRow,
  useBusyKeys,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
] as const;
const CURRENCIES = ["Rs", "PKR", "USD", "AED", "SAR", "EUR", "GBP"] as const;
const DATE_FORMATS = ["dd/mm/yyyy", "mm/dd/yyyy", "yyyy-mm-dd"] as const;
const THEME_STYLES = ["Modern", "Classic"] as const;

type ToggleKey = {
  [K in keyof GeneralUiSettings]: GeneralUiSettings[K] extends boolean ? K : never;
}[keyof GeneralUiSettings];

/** Tax / Discount live in dedicated user_settings columns, shared with Transaction settings. */
export function useTaxDiscountToggles() {
  const enableTax = useSettingsStore((s) => s.enableTax);
  const enableDiscount = useSettingsStore((s) => s.enableDiscount);
  const setEnableTax = useSettingsStore((s) => s.setEnableTax);
  const setEnableDiscount = useSettingsStore((s) => s.setEnableDiscount);
  const { notify } = useSettingsScreen();
  const { run, isBusy } = useBusyKeys();

  const save = async (key: "tax" | "discount", value: boolean) => {
    try {
      await run(key, () => (key === "tax" ? setEnableTax(value) : setEnableDiscount(value)));
      notify("Setting saved");
    } catch (error) {
      notify(getApiErrorMessage(error, "Couldn't save setting. Please try again."), "error");
    }
  };

  return {
    enableTax,
    enableDiscount,
    taxBusy: isBusy("tax"),
    discountBusy: isBusy("discount"),
    setTax: (v: boolean) => void save("tax", v),
    setDiscount: (v: boolean) => void save("discount", v),
  };
}

function GeneralSettingsContent() {
  const { values, update, isBusy } = useSettingsSection("general");
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const { notify } = useSettingsScreen();
  const taxDiscount = useTaxDiscountToggles();

  const languageLabel = LANGUAGES.find((l) => l.code === language)?.label ?? "Urdu";

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
      <SettingsSection title="Application" icon="tune">
        <SettingsSelectRow
          label="App Language"
          description="Saved on this device."
          value={languageLabel}
          options={LANGUAGES.map((l) => l.label)}
          onChange={(label) => {
            const next = LANGUAGES.find((l) => l.label === label);
            if (next) {
              setLanguage(next.code);
              notify("Language updated");
            }
          }}
        />
        <SettingsSelectRow
          label="Business Currency"
          description="Symbol shown on totals and printed documents."
          value={values.currency}
          options={CURRENCIES}
          busy={isBusy("currency")}
          onChange={(v) => void update("currency", v)}
        />
        <SettingsStepperRow
          label="Decimal Places"
          description="Decimals used for amounts on sales documents and prints."
          value={values.decimalPlaces}
          min={0}
          max={4}
          busy={isBusy("decimalPlaces")}
          onChange={(v) => void update("decimalPlaces", v)}
        />
        <SettingsSelectRow
          label="Date Format"
          description="Format used for dates on printed documents."
          value={values.dateFormat}
          options={DATE_FORMATS}
          busy={isBusy("dateFormat")}
          onChange={(v) => void update("dateFormat", v)}
        />
        {toggle(
          "showUnsavedWarning",
          "Show warning for unsaved changes",
          "Ask before closing a sales form with unsaved edits."
        )}
        <SettingsSelectRow
          label="Theme Style"
          value={values.themeStyle}
          options={THEME_STYLES}
          busy={isBusy("themeStyle")}
          onChange={(v) => void update("themeStyle", v)}
        />
      </SettingsSection>

      <SettingsSection title="Tax & Discount" icon="percent">
        <SettingsToggleRow
          label="Tax"
          description="Show tax fields and totals on sales documents and POS."
          value={taxDiscount.enableTax}
          busy={taxDiscount.taxBusy}
          onChange={taxDiscount.setTax}
        />
        <SettingsToggleRow
          label="Discount"
          description="Show discount fields and totals on sales documents and POS."
          value={taxDiscount.enableDiscount}
          busy={taxDiscount.discountBusy}
          onChange={taxDiscount.setDiscount}
        />
        <SettingsNote>
          Applies to Quotation, Sales Order, Invoice, other sales documents and POS. Amounts on
          documents that are already saved are not changed.
        </SettingsNote>
      </SettingsSection>

      <SettingsSection title="More Transactions" icon="receipt_long" description="Turn transaction types on or off in menus">
        {toggle("estimateQuotation", "Estimate / Quotation")}
        {toggle("proformaInvoice", "Proforma Invoice")}
        {toggle("otherIncome", "Other Income")}
        {toggle("salePurchaseOrder", "Sale / Purchase Order")}
        {toggle("fixedAssets", "Fixed Assets (FA)")}
        {toggle("deliveryNote", "Delivery Note")}
        {toggle("goodReturnOnDeliveryNote", "Goods return on Delivery Note")}
        {toggle("printAmountOnNote", "Print amount on Delivery Note", "Include rates and totals when printing delivery notes.")}
      </SettingsSection>
    </>
  );
}

export function GeneralSettingsScreen() {
  return (
    <SettingsLayout title="General">
      <GeneralSettingsContent />
    </SettingsLayout>
  );
}
