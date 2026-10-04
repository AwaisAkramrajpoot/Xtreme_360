"use client";

import { useRouter } from "next/navigation";
import { AppColors } from "@/constants/colors";
import { settingsItems } from "@/constants/menu-data";
import type { PrefixOption, PrefixSettings } from "@/constants/app-settings";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import {
  SettingsLayout,
  SettingsLinkRow,
  SettingsSection,
  SettingsSelectRow,
  SettingsIcon,
  SettingsToggleRow,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

const SECTION_META: Record<string, { icon: string; description: string }> = {
  General: { icon: "tune", description: "Language, currency, transaction types" },
  Transaction: { icon: "swap_horiz", description: "Sales form fields and totals" },
  "Invoice Print": { icon: "print", description: "Printer, header, totals, footer" },
  Taxes: { icon: "receipt_long", description: "Tax rates and groups" },
  Reminders: { icon: "notifications", description: "Payment and service reminders" },
  Item: { icon: "inventory_2", description: "Item fields, units, stock" },
  Party: { icon: "groups", description: "Party fields and grouping" },
};

const PREFIX_OPTIONS: readonly PrefixOption[] = ["None", "Name"];

const PREFIX_ROWS: Array<{ key: keyof PrefixSettings; label: string }> = [
  { key: "saleInvoice", label: "Sale invoice" },
  { key: "creditNote", label: "Credit note" },
  { key: "saleOrder", label: "Sale order" },
  { key: "purchaseOrder", label: "Purchase order" },
  { key: "estimate", label: "Estimate" },
  { key: "deliveryNote", label: "Delivery note" },
  { key: "paymentIn", label: "Payment in" },
];

function SettingsNavGrid() {
  const router = useRouter();
  const { query } = useSettingsScreen();
  const q = query.trim().toLowerCase();
  const items = settingsItems.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      SECTION_META[item.title]?.description.toLowerCase().includes(q)
  );
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const meta = SECTION_META[item.title] ?? { icon: "tune", description: "" };
        return (
          <button
            key={item.title}
            type="button"
            data-settings-row
            onClick={() => item.href && router.push(item.href)}
            className="group flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(88,129,87,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]"
            style={{ borderColor: AppColors.lightGrey }}
          >
            <SettingsIcon name={meta.icon} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs leading-snug" style={{ color: AppColors.grey }}>
                {meta.description}
              </span>
            </span>
            <span className="material-icons shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: AppColors.grey, fontSize: 22 }}>
              chevron_right
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SettingsHubContent() {
  const hub = useSettingsSection("hub");
  const prefixes = useSettingsSection("prefixes");
  const businessName = useSessionProfileStore((s) => s.business?.name);
  const { notify } = useSettingsScreen();

  return (
    <>
      <SettingsNavGrid />

      <SettingsSection title="Security" icon="lock">
        <SettingsToggleRow
          label="Passcode / fingerprint (if present)"
          description="Require device unlock to open the app."
          value={hub.values.passcodeFingerprint}
          busy={hub.isBusy("passcodeFingerprint")}
          onChange={(v) => void hub.update("passcodeFingerprint", v)}
        />
      </SettingsSection>

      <SettingsSection title="Multifirm" icon="domain">
        <SettingsLinkRow
          label="Multifirm settings"
          value={businessName || undefined}
          onClick={() => notify("Multifirm is coming soon")}
        />
      </SettingsSection>

      <SettingsSection title="Stock Transfer Between Stores" icon="move_up">
        <SettingsToggleRow
          label="Store management & stock transfer"
          value={hub.values.storeManagement}
          busy={hub.isBusy("storeManagement")}
          onChange={(v) => void hub.update("storeManagement", v)}
        />
      </SettingsSection>

      <SettingsSection title="Backup" icon="backup">
        <SettingsToggleRow
          label="Backup settings"
          description="Include backup options in Backup & Restore."
          value={hub.values.backupSettings}
          busy={hub.isBusy("backupSettings")}
          onChange={(v) => void hub.update("backupSettings", v)}
        />
      </SettingsSection>

      <SettingsSection
        title="Transaction Prefixes"
        icon="tag"
        description={businessName ? `Firm: ${businessName}` : "Prefix added before document numbers"}
      >
        {PREFIX_ROWS.map((row) => (
          <SettingsSelectRow
            key={row.key}
            label={row.label}
            value={prefixes.values[row.key]}
            options={PREFIX_OPTIONS}
            busy={prefixes.isBusy(row.key)}
            onChange={(v) => void prefixes.update(row.key, v)}
          />
        ))}
      </SettingsSection>
    </>
  );
}

export function SettingsScreen() {
  return (
    <SettingsLayout title="Settings">
      <SettingsHubContent />
    </SettingsLayout>
  );
}
