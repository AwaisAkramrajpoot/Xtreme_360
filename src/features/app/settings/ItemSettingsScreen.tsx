"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppColors } from "@/constants/colors";
import { itemTypeLabel, type ItemSettings } from "@/constants/item-settings";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";
import {
  SettingsLayout,
  SettingsLinkRow,
  SettingsSection,
  SettingsStepperRow,
  SettingsToggleRow,
  useSettingsScreen,
  useSettingsSection,
} from "./SettingsUi";

type ToggleKey = {
  [K in keyof ItemSettings]: ItemSettings[K] extends boolean ? K : never;
}[keyof ItemSettings];

const ADDITIONAL_FIELDS: Array<{ key: ToggleKey; label: string }> = [
  { key: "brand", label: "Brand" },
  { key: "serialNumber", label: "Serial Number" },
  { key: "modelNumber", label: "Model Number" },
  { key: "warranty", label: "Warranty" },
  { key: "manufacturingDate", label: "Manufacturing Date" },
  { key: "expiryDate", label: "Expiry Date" },
  { key: "batch", label: "Batch" },
  { key: "weight", label: "Weight" },
  { key: "color", label: "Color" },
  { key: "size", label: "Size" },
  { key: "description", label: "Description" },
];

function ItemTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const patchItemSettings = useSettingsStore((s) => s.patchItemSettings);
  const { notify } = useSettingsScreen();
  const [draftProducts, setDraftProducts] = useState(itemSettings.enableProducts);
  const [draftServices, setDraftServices] = useState(itemSettings.enableServices);
  const [draftManufacturing, setDraftManufacturing] = useState(itemSettings.manufacturing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!draftProducts && !draftServices) {
      setError("Enable at least one item type.");
      return;
    }
    if (draftManufacturing && !draftProducts) {
      setError("Manufacturing makes products, so Products must be on too.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await patchItemSettings({
        enableProducts: draftProducts,
        enableServices: draftServices,
        manufacturing: draftManufacturing,
      });
      notify("Item type updated");
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save item type"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Item Type"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg font-semibold"
            style={{ backgroundColor: AppColors.lightGrey }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-11 flex-1 rounded-lg font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: AppColors.primary }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        {[
          { label: "Products", value: draftProducts, set: setDraftProducts },
          { label: "Services", value: draftServices, set: setDraftServices },
          { label: "Manufacturing", value: draftManufacturing, set: setDraftManufacturing },
        ].map((row) => (
          <div
            key={row.label}
            className="flex min-h-12 items-center justify-between rounded-xl px-3"
            style={{ backgroundColor: AppColors.bgColor2 }}
          >
            <span className="text-sm font-medium text-black">{row.label}</span>
            <AppSwitch value={row.value} onChange={row.set} ariaLabel={row.label} />
          </div>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="pt-1 text-xs" style={{ color: AppColors.grey }}>
          These control which tabs appear on Items. Manufacturing needs Products.
        </p>
      </div>
    </AppModal>
  );
}

function ItemSettingsContent() {
  const { values, update, isBusy } = useSettingsSection("item");
  const { notify } = useSettingsScreen();
  const [typeModalOpen, setTypeModalOpen] = useState(false);

  const toggle = (key: ToggleKey, label: string, description?: string) => (
    <SettingsToggleRow
      key={key}
      label={label}
      description={description}
      value={values[key]}
      busy={isBusy(key)}
      onChange={(v) => void update(key, v)}
    />
  );

  return (
    <>
      <SettingsSection title="Items" icon="inventory_2">
        {toggle("enableItem", "Enable Item", "Show the Items module across the app.")}
        <SettingsLinkRow
          label="Item Type"
          description="Choose between products, services, or both."
          value={itemTypeLabel(values)}
          onClick={() => setTypeModalOpen(true)}
        />
        {toggle("barcodeScanning", "Barcode scanning for items", "Add a barcode / item code field to items.")}
        {toggle("stockMaintenance", "Stock maintenance", "Track opening stock and stock levels.")}
        {toggle("itemUnit", "Item Unit")}
        {toggle("itemCategory", "Item Category")}
        {toggle("wholesalePrice", "Wholesale Price")}
        <SettingsStepperRow
          label="Quantity decimal places"
          description="Decimal places allowed for item quantities."
          value={values.quantityDecimals}
          min={0}
          max={6}
          busy={isBusy("quantityDecimals")}
          onChange={(v) => void update("quantityDecimals", v)}
        />
      </SettingsSection>

      <SettingsSection title="Tax & Discount" icon="percent">
        {toggle("itemWiseTax", "Item wise tax")}
        {toggle("itemWiseDiscountRs", "Item wise discount (amount)")}
        {toggle("itemWiseDiscountPercent", "Item wise discount (%)")}
      </SettingsSection>

      <SettingsSection title="Advanced" icon="precision_manufacturing">
        {toggle("manufacturing", "Manufacturing", "Show the Manufacturing tab on Items.")}
        {toggle("updateSalePriceFromTxn", "Update sale price from transaction")}
      </SettingsSection>

      <SettingsSection title="Additional Item Fields" icon="list_alt" defaultOpen={false}>
        {ADDITIONAL_FIELDS.map((field) => toggle(field.key, field.label))}
        <SettingsLinkRow label="Item Custom Fields" onClick={() => notify("Custom fields are coming soon")} />
      </SettingsSection>

      {typeModalOpen && <ItemTypeModal open onClose={() => setTypeModalOpen(false)} />}
    </>
  );
}

export function ItemSettingsScreen() {
  return (
    <SettingsLayout title="Item Settings">
      <ItemSettingsContent />
    </SettingsLayout>
  );
}
