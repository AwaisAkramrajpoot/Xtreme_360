"use client";

import { useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppColors } from "@/constants/colors";

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
    <div className="flex min-h-10 items-center justify-between rounded-md px-3" style={{ backgroundColor: AppColors.bgColor2 }}>
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

function ArrowRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
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
      <div className="flex items-center gap-2">
        {value && <span className="text-xs" style={{ color: AppColors.grey }}>{value}</span>}
        <span className="material-icons text-black">chevron_right</span>
      </div>
    </button>
  );
}

function CounterRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-md px-3" style={{ backgroundColor: AppColors.bgColor2 }}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-black">{label}</span>
        <span className="material-icons text-[13px]" style={{ color: AppColors.grey }}>
          info_outline
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-base"
          style={{ color: AppColors.primary }}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          -
        </button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-base"
          style={{ color: AppColors.primary }}
          onClick={() => onChange(Math.min(9, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function InvoicePrintScreen() {
  const [printMode, setPrintMode] = useState<"Regular" | "Thermal">("Regular");
  const [minRows, setMinRows] = useState(0);
  const [extraPdf, setExtraPdf] = useState(0);
  const [thermalExtraLines, setThermalExtraLines] = useState(0);
  const [thermalCopies, setThermalCopies] = useState(2);

  const [makeDefault, setMakeDefault] = useState(true);
  const [repeatHeader, setRepeatHeader] = useState(true);
  const [companyName, setCompanyName] = useState(true);
  const [companyLogo, setCompanyLogo] = useState(true);
  const [address, setAddress] = useState(true);
  const [email, setEmail] = useState(true);
  const [phone, setPhone] = useState(true);
  const [tinOnSale, setTinOnSale] = useState(false);
  const [printOriginal, setPrintOriginal] = useState(false);
  const [nativePrinting, setNativePrinting] = useState(true);
  const [useTextStyling, setUseTextStyling] = useState(true);
  const [autoCutPaper, setAutoCutPaper] = useState(false);
  const [openDrawerAfterPrint, setOpenDrawerAfterPrint] = useState(false);

  const [totalQty, setTotalQty] = useState(true);
  const [amountDecimal, setAmountDecimal] = useState(true);
  const [receivedAmount, setReceivedAmount] = useState(true);
  const [balanceAmount, setBalanceAmount] = useState(true);
  const [currentPartyBalance, setCurrentPartyBalance] = useState(false);
  const [taxDetails, setTaxDetails] = useState(true);
  const [amountGrouping, setAmountGrouping] = useState(true);
  const [youSaved, setYouSaved] = useState(true);

  const [printDescription, setPrintDescription] = useState(true);
  const [receivedByDetails, setReceivedByDetails] = useState(true);
  const [deliveredByDetails, setDeliveredByDetails] = useState(true);
  const [signatureText, setSignatureText] = useState(true);
  const [paymentMode, setPaymentMode] = useState(false);
  const [printAcknowledgement, setPrintAcknowledgement] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F4]">
      <AppAppBar title="Invoice Print" showBack showSearch />
      <div className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="overflow-hidden rounded-md border" style={{ borderColor: AppColors.lightGrey }}>
          <div className="grid grid-cols-2 bg-white p-1">
            <button
              type="button"
              onClick={() => setPrintMode("Regular")}
              className="rounded py-1.5 text-xs"
              style={{
                backgroundColor: printMode === "Regular" ? AppColors.primary : "transparent",
                color: printMode === "Regular" ? "#fff" : "#111",
              }}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => setPrintMode("Thermal")}
              className="rounded py-1.5 text-xs"
              style={{
                backgroundColor: printMode === "Thermal" ? AppColors.primary : "transparent",
                color: printMode === "Thermal" ? "#fff" : "#111",
              }}
            >
              Thermal
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <ToggleRow label={`Make ${printMode} Printer Default`} value={makeDefault} onChange={setMakeDefault} />

          {printMode === "Regular" ? (
            <>
              <SectionCard title="Themes">
                <ArrowRow label="Change Theme and colors" />
              </SectionCard>

              <SectionCard title="Print Setting">
                <ArrowRow label="Print text size" value="Medium" />
                <ArrowRow label="Page Size" value="A4(210X297mm)" />
                <ArrowRow label="Print text size" value="Portait" />
              </SectionCard>

              <SectionCard title="Print Company Info/Header">
                <ToggleRow label="Print repeat header in all pages" value={repeatHeader} onChange={setRepeatHeader} />
                <ToggleRow label="Print Company Name" value={companyName} onChange={setCompanyName} />
                <ArrowRow label="Company Name Text Size" value="Portait" />
                <ToggleRow label="Company Logo" value={companyLogo} onChange={setCompanyLogo} />
                <ToggleRow label="Address" value={address} onChange={setAddress} />
                <ToggleRow label="Email" value={email} onChange={setEmail} />
                <ToggleRow label="Phone number" value={phone} onChange={setPhone} />
                <ToggleRow label="TIN on Sale" value={tinOnSale} onChange={setTinOnSale} />
                <CounterRow label="Extra space on top of PDF" value={extraPdf} onChange={setExtraPdf} />
                <ToggleRow label="Print Original/Duplicate" value={printOriginal} onChange={setPrintOriginal} />
                <ArrowRow label="Change Transaction Names" />
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard title="Thermal Printer Settings">
                <ArrowRow label="Set default thermal Printer" />
                <ToggleRow label="Native Language Printing" value={nativePrinting} onChange={setNativePrinting} />
                <ArrowRow label="Thermal printer page size" value="3 inch (80mm)" />
                <CounterRow label="Extra lines at print end" value={thermalExtraLines} onChange={setThermalExtraLines} />
                <CounterRow label="Number of copies" value={thermalCopies} onChange={setThermalCopies} />
                <ToggleRow label="Use Text Styling (Bold, Italic...)" value={useTextStyling} onChange={setUseTextStyling} />
                <ToggleRow label="Auto cut paper after printing" value={autoCutPaper} onChange={setAutoCutPaper} />
                <ToggleRow label="Open cash drawer after printing" value={openDrawerAfterPrint} onChange={setOpenDrawerAfterPrint} />
              </SectionCard>

              <SectionCard title="Themes">
                <ArrowRow label="Change Thermal Printer theme" value="Theme 3" />
              </SectionCard>

              <SectionCard title="Print Company Info/Header">
                <ToggleRow label="Print Company Name" value={companyName} onChange={setCompanyName} />
                <ToggleRow label="Company logo" value={companyLogo} onChange={setCompanyLogo} />
                <ToggleRow label="Address" value={address} onChange={setAddress} />
                <ToggleRow label="Email" value={email} onChange={setEmail} />
                <ToggleRow label="Phone number" value={phone} onChange={setPhone} />
                <ToggleRow label="TIN on Sale" value={tinOnSale} onChange={setTinOnSale} />
                <ArrowRow label="Change Transaction Names" />
              </SectionCard>
            </>
          )}

          <SectionCard title="Total & Taxes">
            <CounterRow label="Min. No. of rows in Item Total" value={minRows} onChange={setMinRows} />
            <ArrowRow label="Item Total Customization" />
            <ToggleRow label="Total Item Quantity" value={totalQty} onChange={setTotalQty} />
            <ToggleRow label="Amount with Decimal(eg 0.00)" value={amountDecimal} onChange={setAmountDecimal} />
            <ToggleRow label="Received amount" value={receivedAmount} onChange={setReceivedAmount} />
            <ToggleRow label="Print Current Balance of Party" value={currentPartyBalance} onChange={setCurrentPartyBalance} />
            <ToggleRow label="Tax Details" value={taxDetails} onChange={setTaxDetails} />
            <ToggleRow label="Amount Grouping" value={amountGrouping} onChange={setAmountGrouping} />
            <ArrowRow label="Amount in words format" value="Indian Eg 1,00,00,0.00" />
            {printMode === "Regular" && (
              <>
                <ToggleRow label="Balance amount" value={balanceAmount} onChange={setBalanceAmount} />
                <ToggleRow label="you Saved" value={youSaved} onChange={setYouSaved} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Footer">
            <ToggleRow label="Print description" value={printDescription} onChange={setPrintDescription} />
            <ArrowRow label="Terms and conditions" />
            {printMode === "Regular" ? (
              <>
                <ToggleRow label="Print Received by details" value={receivedByDetails} onChange={setReceivedByDetails} />
                <ToggleRow label="Print Delivered by details" value={deliveredByDetails} onChange={setDeliveredByDetails} />
                <ToggleRow label="Print SignatureText" value={signatureText} onChange={setSignatureText} />
                <ArrowRow label="Set Custom Signature Text" />
                <ToggleRow label="Payment mode" value={paymentMode} onChange={setPaymentMode} />
                <ToggleRow label="Print Acknowledgment" value={printAcknowledgement} onChange={setPrintAcknowledgement} />
              </>
            ) : (
              <>
                <ToggleRow label="Print SignatureText" value={signatureText} onChange={setSignatureText} />
                <ArrowRow label="Set Custom Signature Text" />
                <ToggleRow label="Payment mode" value={paymentMode} onChange={setPaymentMode} />
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

