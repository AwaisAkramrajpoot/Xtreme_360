"use client";

import { AddProductModal } from "@/components/modals/AddProductModal";
import { AddServiceModal } from "@/components/modals/AddSimpleModals";
import type { ItemRecord } from "@/services/item-api";
import { useSettingsStore } from "@/stores/settings-store";

/**
 * "Add New Item" opened from an item picker (sales, purchase, manufacturing).
 * Uses the Add Item form, or Add Service when the business only sells services.
 */
export function NewItemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (item: ItemRecord) => void;
}) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const servicesOnly = !itemSettings.enableProducts && itemSettings.enableServices;

  return servicesOnly ? (
    <AddServiceModal open={open} onClose={onClose} onCreated={onCreated} />
  ) : (
    <AddProductModal open={open} onClose={onClose} onCreated={onCreated} />
  );
}
