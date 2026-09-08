"use client";

import { useEffect, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppColors } from "@/constants/colors";
import { useSettingsStore } from "@/stores/settings-store";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/utils/api-error";

type PrefixOption = "None" | "Name";

function SectionCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-md border" style={{ borderColor: AppColors.lightGrey }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        style={{ backgroundColor: AppColors.primary }}
      >
        <span className="text-sm text-white">{title}</span>
        <span className="material-icons text-white">
          {open ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>
      {open && <div className="space-y-2 bg-white p-2">{children}</div>}
    </div>
  );
}

function RowWithInfo({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-10 items-center justify-between rounded-md px-3"
      style={{ backgroundColor: AppColors.bgColor2 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-black">{label}</span>
        <span className="material-icons text-[13px]" style={{ color: AppColors.grey }}>
          info_outline
        </span>
      </div>
      {right}
    </div>
  );
}

export function GeneralSettingsScreen() {
  const { showToast, Toast } = useToast();
  const enableTax = useSettingsStore((s) => s.enableTax);
  const enableDiscount = useSettingsStore((s) => s.enableDiscount);
  const loaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const setEnableTax = useSettingsStore((s) => s.setEnableTax);
  const setEnableDiscount = useSettingsStore((s) => s.setEnableDiscount);

  const [showWarning, setShowWarning] = useState(true);
  const [estimateQuotation, setEstimateQuotation] = useState(false);
  const [proformaInvoice, setProformaInvoice] = useState(true);
  const [otherIncome, setOtherIncome] = useState(false);
  const [salePurchaseOrder, setSalePurchaseOrder] = useState(true);
  const [fixedAssets, setFixedAssets] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState(true);
  const [goodReturn, setGoodReturn] = useState(true);
  const [printAmount, setPrintAmount] = useState(false);

  const [language, setLanguage] = useState<string | null>("English");
  const [businessCurrency, setBusinessCurrency] = useState<string | null>("Rs");
  const [themeStyle, setThemeStyle] = useState<string | null>("Modern");
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  const [saleInvoice, setSaleInvoice] = useState<PrefixOption>("None");
  const [creditNote, setCreditNote] = useState<PrefixOption>("None");
  const [saleOrder, setSaleOrder] = useState<PrefixOption>("None");
  const [purchaseOrder, setPurchaseOrder] = useState<PrefixOption>("None");
  const [estimate, setEstimate] = useState<PrefixOption>("None");
  const [deliveryNotePrefix, setDeliveryNotePrefix] = useState<PrefixOption>("None");
  const [paymentIn, setPaymentIn] = useState<PrefixOption>("None");

  useEffect(() => {
    if (!loaded) {
      loadSettings().catch(() => undefined);
    }
  }, [loaded, loadSettings]);

  const onTaxToggle = async (value: boolean) => {
    try {
      await setEnableTax(value);
      showToast(value ? "Tax enabled for sales documents" : "Tax hidden on sales documents");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update Tax setting"));
    }
  };

  const onDiscountToggle = async (value: boolean) => {
    try {
      await setEnableDiscount(value);
      showToast(
        value ? "Discount enabled for sales documents" : "Discount hidden on sales documents"
      );
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update Discount setting"));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F4]">
      <AppAppBar title="General" showBack showSearch />
      <div className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="space-y-2">
          <SectionCard title="Application">
            <AppDropDown
              title="App Language"
              items={["English", "Urdu"]}
              value={language}
              onChange={setLanguage}
            />
            <AppDropDown
              title="Business Currency"
              items={["Rs", "USD", "AED"]}
              value={businessCurrency}
              onChange={setBusinessCurrency}
            />

            <RowWithInfo
              label="Decimal Places"
              right={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded text-base"
                    style={{ color: AppColors.primary }}
                    onClick={() => setDecimalPlaces((v) => Math.max(0, v - 1))}
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-sm">{decimalPlaces}</span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded text-base"
                    style={{ color: AppColors.primary }}
                    onClick={() => setDecimalPlaces((v) => Math.min(6, v + 1))}
                  >
                    +
                  </button>
                </div>
              }
            />

            <AppTextField title="Date Format" hintText="dd/mm/yyyy" value="" onChange={() => {}} isDateField />

            <RowWithInfo
              label="Show warning for unsaved changes"
              right={<AppSwitch value={showWarning} onChange={setShowWarning} />}
            />

            <AppDropDown
              title="Theme Style"
              items={["Modern", "Classic"]}
              value={themeStyle}
              onChange={setThemeStyle}
            />
          </SectionCard>

          <SectionCard title="Tax & Discount">
            <RowWithInfo
              label="Tax"
              right={<AppSwitch value={enableTax} onChange={onTaxToggle} />}
            />
            <RowWithInfo
              label="Discount"
              right={<AppSwitch value={enableDiscount} onChange={onDiscountToggle} />}
            />
            <p className="px-2 pb-1 text-[11px]" style={{ color: AppColors.grey }}>
              These settings apply globally to Quotation, Sales Order, Invoice and other sales
              documents. Existing saved amounts are not deleted.
            </p>
          </SectionCard>

          <SectionCard title="More Transactions">
            <RowWithInfo
              label="Estimate /Quotation"
              right={<AppSwitch value={estimateQuotation} onChange={setEstimateQuotation} />}
            />
            <RowWithInfo
              label="Proforma Invoice"
              right={<AppSwitch value={proformaInvoice} onChange={setProformaInvoice} />}
            />
            <RowWithInfo
              label="Other Income"
              right={<AppSwitch value={otherIncome} onChange={setOtherIncome} />}
            />
            <RowWithInfo
              label="Sale/Purchase Order"
              right={<AppSwitch value={salePurchaseOrder} onChange={setSalePurchaseOrder} />}
            />
            <RowWithInfo
              label="Fixed Assets (FA)"
              right={<AppSwitch value={fixedAssets} onChange={setFixedAssets} />}
            />
            <RowWithInfo
              label="Delivery Note"
              right={<AppSwitch value={deliveryNote} onChange={setDeliveryNote} />}
            />
            <RowWithInfo
              label="Good Return on Delivery Note"
              right={<AppSwitch value={goodReturn} onChange={setGoodReturn} />}
            />
            <RowWithInfo
              label="Print Amount on Note"
              right={<AppSwitch value={printAmount} onChange={setPrintAmount} />}
            />
          </SectionCard>

          <SectionCard title="Transaction Prefixes">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <AppDropDown title="Sale invoices" items={["None", "Name"]} value={saleInvoice} onChange={setSaleInvoice} />
              <AppDropDown title="Credit Note" items={["None", "Name"]} value={creditNote} onChange={setCreditNote} />
              <AppDropDown title="Sale Oder" items={["None", "Name"]} value={saleOrder} onChange={setSaleOrder} />
              <AppDropDown title="Purchase Oder" items={["None", "Name"]} value={purchaseOrder} onChange={setPurchaseOrder} />
              <AppDropDown title="Estimate" items={["None", "Name"]} value={estimate} onChange={setEstimate} />
              <AppDropDown title="Delivery Note" items={["None", "Name"]} value={deliveryNotePrefix} onChange={setDeliveryNotePrefix} />
              <AppDropDown title="Payment - in" items={["None", "Name"]} value={paymentIn} onChange={setPaymentIn} />
            </div>
          </SectionCard>
        </div>
      </div>
      {Toast}
    </div>
  );
}
