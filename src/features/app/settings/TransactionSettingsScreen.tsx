"use client";

import { useEffect, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppColors } from "@/constants/colors";
import { useSettingsStore } from "@/stores/settings-store";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/utils/api-error";

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

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
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
      <AppSwitch value={value} onChange={onChange} />
    </div>
  );
}

function ArrowRow({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left"
      style={{ backgroundColor: AppColors.bgColor2 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-black">{label}</span>
        <span className="material-icons text-[13px]" style={{ color: AppColors.grey }}>
          info_outline
        </span>
      </div>
      <span className="material-icons text-black">chevron_right</span>
    </button>
  );
}

export function TransactionSettingsScreen() {
  const { showToast, Toast } = useToast();
  const enableTax = useSettingsStore((s) => s.enableTax);
  const enableDiscount = useSettingsStore((s) => s.enableDiscount);
  const loaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const setEnableTax = useSettingsStore((s) => s.setEnableTax);
  const setEnableDiscount = useSettingsStore((s) => s.setEnableDiscount);

  const [invoiceBillNo, setInvoiceBillNo] = useState(true);
  const [cashSaleByDefault, setCashSaleByDefault] = useState(false);
  const [billingParty, setBillingParty] = useState(false);
  const [poDetails, setPoDetails] = useState(false);
  const [addTime, setAddTime] = useState(false);

  const [inclusiveTax, setInclusiveTax] = useState(true);
  const [purchasePrice, setPurchasePrice] = useState(true);
  const [itemQty, setItemQty] = useState(false);
  const [barcode, setBarcode] = useState(false);
  const [roundOff, setRoundOff] = useState(false);
  const [passcodeDelete, setPasscodeDelete] = useState(false);
  const [discountDuringPayment, setDiscountDuringPayment] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(true);
  const [showProfit, setShowProfit] = useState(false);

  useEffect(() => {
    if (!loaded) {
      loadSettings().catch(() => undefined);
    }
  }, [loaded, loadSettings]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F4]">
      <AppAppBar title="Transaction" showBack showSearch />
      <div className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="space-y-2">
          <SectionCard title="Transaction Header">
            <ToggleRow label="Invoice/Bill Number" value={invoiceBillNo} onChange={setInvoiceBillNo} />
            <ToggleRow label="Cash Sale By default" value={cashSaleByDefault} onChange={setCashSaleByDefault} />
            <ToggleRow label="Billing name of parties" value={billingParty} onChange={setBillingParty} />
            <ToggleRow label="PO Details (of customer)" value={poDetails} onChange={setPoDetails} />
            <ToggleRow label="Add Time On Transaction" value={addTime} onChange={setAddTime} />
          </SectionCard>

          <SectionCard title="Items Table">
            <ToggleRow
              label="Allow Inclusive/Exclusive tax on Rate (Price/unit)"
              value={inclusiveTax}
              onChange={setInclusiveTax}
            />
            <ToggleRow label="Display Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
            <ToggleRow label="Free Item quantity" value={itemQty} onChange={setItemQty} />
            <ToggleRow label="Barcode scanning for items" value={barcode} onChange={setBarcode} />
          </SectionCard>

          <SectionCard title="Taxes, Discount & Total">
            <ToggleRow
              label="Transaction wise Tax"
              value={enableTax}
              onChange={async (value) => {
                try {
                  await setEnableTax(value);
                } catch (err) {
                  showToast(getApiErrorMessage(err, "Failed to update Tax setting"));
                }
              }}
            />
            <ToggleRow
              label="Transaction wise Discount"
              value={enableDiscount}
              onChange={async (value) => {
                try {
                  await setEnableDiscount(value);
                } catch (err) {
                  showToast(getApiErrorMessage(err, "Failed to update Discount setting"));
                }
              }}
            />
            <ToggleRow label="Round Of Transaction Amount" value={roundOff} onChange={setRoundOff} />
          </SectionCard>

          <SectionCard title="More Transaction Features">
            <ArrowRow label="Share Transaction as" />
            <ToggleRow label="Passcode for edit/delete" value={passcodeDelete} onChange={setPasscodeDelete} />
            <ToggleRow
              label="Discount during Payment"
              value={discountDuringPayment}
              onChange={setDiscountDuringPayment}
            />
            <ArrowRow label="Due Dates and Payment terms" />
            <ToggleRow label="Enable Invoice Previse" value={invoicePreview} onChange={setInvoicePreview} />
            <ArrowRow label="Additional Fields" />
            <ArrowRow label="Transportation Details" />
            <ToggleRow
              label="Show Profit while making Sale Invoice"
              value={showProfit}
              onChange={setShowProfit}
            />
          </SectionCard>
        </div>
      </div>
      {Toast}
    </div>
  );
}
