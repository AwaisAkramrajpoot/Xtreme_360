/** Defaults for Item Settings — controls Items module UI/fields. */
export type ItemSettings = {
  enableItem: boolean;
  enableProducts: boolean;
  enableServices: boolean;
  barcodeScanning: boolean;
  stockMaintenance: boolean;
  itemUnit: boolean;
  itemCategory: boolean;
  wholesalePrice: boolean;
  quantityDecimals: number;
  itemWiseTax: boolean;
  itemWiseDiscountRs: boolean;
  itemWiseDiscountPercent: boolean;
  manufacturing: boolean;
  updateSalePriceFromTxn: boolean;
  brand: boolean;
  serialNumber: boolean;
  modelNumber: boolean;
  warranty: boolean;
  manufacturingDate: boolean;
  expiryDate: boolean;
  batch: boolean;
  weight: boolean;
  color: boolean;
  size: boolean;
  description: boolean;
};

export const DEFAULT_ITEM_SETTINGS: ItemSettings = {
  enableItem: true,
  enableProducts: true,
  enableServices: true,
  barcodeScanning: false,
  stockMaintenance: true,
  itemUnit: true,
  itemCategory: true,
  wholesalePrice: true,
  quantityDecimals: 2,
  itemWiseTax: false,
  itemWiseDiscountRs: true,
  itemWiseDiscountPercent: false,
  manufacturing: false,
  updateSalePriceFromTxn: false,
  brand: false,
  serialNumber: false,
  modelNumber: false,
  warranty: false,
  manufacturingDate: false,
  expiryDate: false,
  batch: false,
  weight: false,
  color: false,
  size: false,
  description: true,
};

export function mergeItemSettings(raw?: Partial<ItemSettings> | null): ItemSettings {
  return { ...DEFAULT_ITEM_SETTINGS, ...(raw || {}) };
}

export function itemTypeLabel(settings: ItemSettings): string {
  const types = [
    settings.enableProducts && "Products",
    settings.enableServices && "Services",
    settings.manufacturing && "Manufacturing",
  ].filter(Boolean) as string[];
  if (!types.length) return "None";
  if (types.length === 1) return types[0];
  return `${types.slice(0, -1).join(", ")} and ${types[types.length - 1]}`;
}
