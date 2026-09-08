"use client";

import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppColors } from "@/constants/colors";
import { settingsItems } from "@/constants/menu-data";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PrefixType = "None" | "Name";

const SECTION_ICON: Record<string, string> = {
  General: "settings",
  Transaction: "swap_horiz",
  "Invoice Print": "print",
  Taxes: "receipt_long",
  Reminders: "notifications",
  Item: "inventory_2",
  Party: "groups",
};

function HeaderMenuCard({
  title,
  showNew,
  onClick,
}: {
  title: string;
  showNew?: boolean;
  onClick: () => void;
}) {
  const icon = SECTION_ICON[title] ?? "tune";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors hover:brightness-95"
      style={{ backgroundColor: AppColors.primary }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-icons flex h-6 w-6 items-center justify-center rounded border text-sm"
          style={{ borderColor: "rgba(255,255,255,0.6)", color: AppColors.white }}
        >
          {icon}
        </span>
        <span className="text-sm text-white">{title}</span>
        {showNew && (
          <span className="rounded bg-[#EF3A35] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            NEW
          </span>
        )}
      </div>
      <span className="material-icons text-white">chevron_right</span>
    </button>
  );
}

function SettingsAccordion({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
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

function InfoRow({
  title,
  trailing,
  clickable,
}: {
  title: string;
  trailing?: React.ReactNode;
  clickable?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left"
      style={{ backgroundColor: AppColors.bgColor2 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-black">{title}</span>
        <span className="material-icons text-[14px]" style={{ color: AppColors.grey }}>
          info_outline
        </span>
      </div>
      {trailing ?? (clickable ? <span className="material-icons text-black">chevron_right</span> : null)}
    </button>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const [passcode, setPasscode] = useState(false);
  const [stockTransfer, setStockTransfer] = useState(true);
  const [backup, setBackup] = useState(false);
  const [firm, setFirm] = useState<string | null>("Kasim");
  const [saleInvoice, setSaleInvoice] = useState<PrefixType>("None");
  const [creditNote, setCreditNote] = useState<PrefixType>("None");
  const [saleOrder, setSaleOrder] = useState<PrefixType>("None");
  const [purchaseOrder, setPurchaseOrder] = useState<PrefixType>("None");
  const [estimate, setEstimate] = useState<PrefixType>("None");
  const [deliveryNote, setDeliveryNote] = useState<PrefixType>("None");
  const [paymentIn, setPaymentIn] = useState<PrefixType>("None");

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F4F4]">
      <AppAppBar title="General Setting" showBack showSearch />
      <div className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="space-y-1.5">
          {settingsItems.map((item, index) => (
            <HeaderMenuCard
              key={item.title}
              title={item.title}
              showNew={index === 0 || index === 1}
              onClick={() => item.href && router.push(item.href)}
            />
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <SettingsAccordion title="Security">
            <InfoRow
              title="Passcode/Fingerprint(if Present)"
              trailing={<AppSwitch value={passcode} onChange={setPasscode} />}
            />
          </SettingsAccordion>

          <SettingsAccordion title="Multiform">
            <InfoRow title="Multiform Settings" clickable />
          </SettingsAccordion>

          <SettingsAccordion title="Stock Transfer Between Stores">
            <InfoRow
              title="Store management & Stock transfer"
              trailing={<AppSwitch value={stockTransfer} onChange={setStockTransfer} />}
            />
          </SettingsAccordion>

          <SettingsAccordion title="Backup">
            <InfoRow title="Backup Settings" trailing={<AppSwitch value={backup} onChange={setBackup} />} />
          </SettingsAccordion>

          <SettingsAccordion title="Transaction Prefixes" defaultOpen>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <AppDropDown
                title="Firm"
                items={["Kasim", "Main Store", "Branch 1"]}
                value={firm}
                onChange={setFirm}
                hintText="Select firm"
              />
              <div />
              <AppDropDown title="Sale invoices" items={["None", "Name"]} value={saleInvoice} onChange={setSaleInvoice} />
              <AppDropDown title="Credit Note" items={["None", "Name"]} value={creditNote} onChange={setCreditNote} />
              <AppDropDown title="Sale Oder" items={["None", "Name"]} value={saleOrder} onChange={setSaleOrder} />
              <AppDropDown title="Purchase Oder" items={["None", "Name"]} value={purchaseOrder} onChange={setPurchaseOrder} />
              <AppDropDown title="Estimate" items={["None", "Name"]} value={estimate} onChange={setEstimate} />
              <AppDropDown title="Delivery Note" items={["None", "Name"]} value={deliveryNote} onChange={setDeliveryNote} />
              <AppDropDown title="Payment - in" items={["None", "Name"]} value={paymentIn} onChange={setPaymentIn} />
            </div>
          </SettingsAccordion>
        </div>
      </div>
    </div>
  );
}
