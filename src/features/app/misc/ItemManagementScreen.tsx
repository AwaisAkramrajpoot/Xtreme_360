"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { AddLabelButton } from "@/components/ui/AddLabelButton";
import { EntityModal } from "@/components/modals/EntityModal";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import type { EntityModalType } from "@/components/modals";
import {
  deleteItemCategory,
  getItems,
  type ItemCategoryRecord,
  type ItemRecord,
} from "@/services/item-api";
import { getUnitsOverview, type UnitOverviewRecord } from "@/services/unit-api";
import { getManufacturing, type ManufacturingRecord } from "@/services/manufacturing-api";
import { IconButton } from "@/components/ui/IconButton";
import { SetConversionModal } from "@/components/modals/SetConversionModal";
import { getApiErrorMessage } from "@/utils/api-error";
import { useLoadingStore } from "@/stores/loading-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useItemLookupStore } from "@/stores/item-lookup-store";

type TabDef = {
  key: string;
  label: string;
  modalType: EntityModalType;
  addLabel: string;
  successMsg: string;
};

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs 0";
  return `Rs ${amount.toLocaleString()}`;
}

function formatQty(value: string | number | null | undefined, decimals: number) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, decimals),
  });
}

type ItemManagementProps = {
  /** Tab to show first: products | services | manufacturing | categories | units. */
  initialTab?: string;
  /** Open that tab's add form on arrival (used by the /add-* routes). */
  openAdd?: boolean;
  /** Open the Set Conversion form on arrival (Units tab). */
  openConversion?: boolean;
};

export function ItemManagementScreen({ initialTab, openAdd = false, openConversion = false }: ItemManagementProps = {}) {
  const itemSettings = useSettingsStore((s) => s.itemSettings);
  const loaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const tabs = useMemo<TabDef[]>(() => {
    if (!itemSettings.enableItem) return [];
    const next: TabDef[] = [];
    if (itemSettings.enableProducts) {
      next.push({
        key: "products",
        label: "Products",
        modalType: "product",
        addLabel: "Product",
        successMsg: "Product saved successfully!",
      });
    }
    if (itemSettings.enableServices) {
      next.push({
        key: "services",
        label: "Services",
        modalType: "service",
        addLabel: "Service",
        successMsg: "Service saved successfully!",
      });
    }
    if (itemSettings.manufacturing) {
      next.push({
        key: "manufacturing",
        label: "Manufacturing",
        modalType: "manufacturing",
        addLabel: "Manufacturing",
        successMsg: "Manufacturing saved successfully!",
      });
    }
    if (itemSettings.itemCategory) {
      next.push({
        key: "categories",
        label: "Categories",
        modalType: "category",
        addLabel: "Category",
        successMsg: "Category saved successfully!",
      });
    }
    if (itemSettings.itemUnit) {
      next.push({
        key: "units",
        label: "Units",
        modalType: "unit",
        addLabel: "Unit",
        successMsg: "Unit saved successfully!",
      });
    }
    return next;
  }, [itemSettings]);

  const [activeTab, setActiveTab] = useState(() => Math.max(0, tabs.findIndex((t) => t.key === initialTab)));
  const [conversionOpen, setConversionOpen] = useState(openConversion);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ItemRecord[]>([]);
  const [services, setServices] = useState<ItemRecord[]>([]);
  const [manufacturing, setManufacturing] = useState<ManufacturingRecord[]>([]);
  const categories: ItemCategoryRecord[] = useItemLookupStore((s) => s.categories);
  const loadCategories = useItemLookupStore((s) => s.loadCategories);
  const removeCategory = useItemLookupStore((s) => s.removeCategory);
  const [units, setUnits] = useState<UnitOverviewRecord[]>([]);
  const [itemCountsByCategory, setItemCountsByCategory] = useState<Record<string, number>>({});

  const { confirm } = useConfirm();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const { open, openModal, closeModal } = useModal(openAdd);
  const { showToast, Toast } = useToast();

  const safeTabIndex = tabs.length ? Math.min(activeTab, tabs.length - 1) : 0;
  const current = tabs[safeTabIndex];

  useEffect(() => {
    if (!loaded) loadSettings().catch(() => undefined);
  }, [loaded, loadSettings]);

  useEffect(() => {
    if (activeTab >= tabs.length) setActiveTab(0);
  }, [tabs.length, activeTab]);

  const loadTabData = useCallback(
    async (tabKey: string) => {
      setLoading(true);
      setError(null);
      try {
        if (tabKey === "products") {
          setProducts(await getItems("product"));
        } else if (tabKey === "services") {
          setServices(await getItems("service"));
        } else if (tabKey === "manufacturing") {
          setManufacturing(await getManufacturing());
        } else if (tabKey === "categories") {
          const [, allItems] = await Promise.all([loadCategories(), getItems()]);
          const counts: Record<string, number> = {};
          for (const item of allItems) {
            const key = (item.item_category || "Uncategorized").trim() || "Uncategorized";
            counts[key] = (counts[key] || 0) + 1;
          }
          setItemCountsByCategory(counts);
        } else if (tabKey === "units") {
          setUnits(await getUnitsOverview());
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load items"));
      } finally {
        setLoading(false);
      }
    },
    [loadCategories]
  );

  useEffect(() => {
    if (!current) return;
    void loadTabData(current.key);
  }, [current, loadTabData]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.item_name?.toLowerCase().includes(q) ||
        p.item_category?.toLowerCase().includes(q) ||
        p.item_code?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.item_name?.toLowerCase().includes(q) || s.item_category?.toLowerCase().includes(q)
    );
  }, [services, search]);

  const filteredManufacturing = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return manufacturing;
    return manufacturing.filter((m) => m.name?.toLowerCase().includes(q));
  }, [manufacturing, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [categories, search]);

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.abbreviation?.toLowerCase().includes(q)
    );
  }, [units, search]);

  const handleDeleteCategory = async (categoryId: number) => {
    const ok = await confirm({
      title: "Delete category",
      message: "Delete this category? This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    showLoading("Deleting...");
    try {
      await deleteItemCategory(categoryId);
      removeCategory(categoryId);
      showToast("Category deleted successfully!");
      await loadTabData("categories");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete category"));
    } finally {
      hideLoading();
    }
  };

  if (!itemSettings.enableItem) {
    return (
      <div className="flex min-h-full flex-col">
        <AppAppBar title="Items" showNotification showBack showAvatar />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="material-icons text-5xl" style={{ color: AppColors.grey }}>
            inventory_2
          </span>
          <p className="text-base font-semibold text-black">Items module is turned off</p>
          <p className="max-w-sm text-sm" style={{ color: AppColors.grey }}>
            Enable Item in Settings to use products, services, and related fields.
          </p>
          <Link
            href={RouteName.itemSettings}
            className="mt-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: AppColors.primary }}
          >
            Open Item Settings
          </Link>
        </div>
      </div>
    );
  }

  if (!tabs.length) {
    return (
      <div className="flex min-h-full flex-col">
        <AppAppBar title="Items" showNotification showBack showAvatar />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-base font-semibold text-black">No item types enabled</p>
          <p className="max-w-sm text-sm" style={{ color: AppColors.grey }}>
            Turn on Products, Services, or other options in Item Settings.
          </p>
          <Link
            href={RouteName.itemSettings}
            className="mt-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: AppColors.primary }}
          >
            Open Item Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AppAppBar title="Items" showNotification showBack showAvatar />

      <div className="flex overflow-x-auto border-b" style={{ borderColor: AppColors.lightGrey }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setSearch("");
              setActiveTab(i);
            }}
            className="shrink-0 whitespace-nowrap px-4 py-3 text-[15px] font-semibold"
            style={{
              color: safeTabIndex === i ? AppColors.primary : AppColors.greyishBlack,
              borderBottom:
                safeTabIndex === i ? `2px solid ${AppColors.primary}` : "2px solid transparent",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 p-5">
        <div
          className="flex h-12 flex-1 items-center gap-2 rounded-lg px-4"
          style={{ backgroundColor: AppColors.lightGrey }}
        >
          <span className="material-icons text-xl" style={{ color: AppColors.greyishBlack }}>
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${current.label}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#64646499]"
          />
        </div>
        <AddLabelButton label={current.addLabel} onClick={openModal} />
      </div>

      <div className="space-y-3 px-5 pb-6">
        {loading && (
          <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            Loading {current.label.toLowerCase()}...
          </p>
        )}

        {!loading && error && <p className="py-8 text-center text-sm text-red-500">{error}</p>}

        {!loading && !error && current.key === "products" && (
          filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
              No products yet. Click + Product to add one.
            </p>
          ) : (
            filteredProducts.map((p) => {
              const extra =
                p.extra_json && typeof p.extra_json === "object" ? p.extra_json : {};
              return (
                <div
                  key={p.id}
                  className="rounded-xl border bg-white p-4"
                  style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                >
                  <p className="font-bold text-black">{p.item_name}</p>
                  <p className="text-sm" style={{ color: AppColors.grey }}>
                    {[
                      itemSettings.itemCategory ? `Category: ${p.item_category || "—"}` : null,
                      itemSettings.itemUnit && p.item_unit ? `Unit: ${p.item_unit}` : null,
                      itemSettings.barcodeScanning && p.item_code ? `Code: ${p.item_code}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {itemSettings.description && p.description && (
                    <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                      {p.description}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <span>Purchase: {formatMoney(p.purchase_price)}</span>
                    {itemSettings.wholesalePrice && (
                      <span>Wholesale: {formatMoney(p.wholesale_price)}</span>
                    )}
                    <span>Sale: {formatMoney(p.sale_price)}</span>
                    {itemSettings.stockMaintenance && (
                      <span>Qty: {formatQty(p.opening_stock, itemSettings.quantityDecimals)}</span>
                    )}
                    {itemSettings.itemWiseTax && (
                      <span>Tax: {Number(p.tax_percent || 0)}%</span>
                    )}
                    {itemSettings.brand && extra.brand && <span>Brand: {extra.brand}</span>}
                    {itemSettings.color && extra.color && <span>Color: {extra.color}</span>}
                    {itemSettings.size && extra.size && <span>Size: {extra.size}</span>}
                  </div>
                </div>
              );
            })
          )
        )}

        {!loading && !error && current.key === "services" && (
          filteredServices.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
              No services yet. Click + Service to add one.
            </p>
          ) : (
            filteredServices.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border bg-white p-4"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <p className="font-bold text-black">{s.item_name}</p>
                {((itemSettings.itemCategory && s.item_category) || (itemSettings.itemUnit && s.item_unit)) && (
                  <p className="text-sm" style={{ color: AppColors.grey }}>
                    {[
                      itemSettings.itemCategory && s.item_category ? `Category: ${s.item_category}` : null,
                      itemSettings.itemUnit && s.item_unit ? `Unit: ${s.item_unit}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <span>Purchase: {formatMoney(s.purchase_price)}</span>
                  {itemSettings.wholesalePrice && <span>Wholesale: {formatMoney(s.wholesale_price)}</span>}
                  <span>Sale: {formatMoney(s.sale_price)}</span>
                </div>
              </div>
            ))
          )
        )}

        {!loading && !error && current.key === "manufacturing" && (
          filteredManufacturing.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
              No manufacturing yet. Click + Manufacturing to add one.
            </p>
          ) : (
            filteredManufacturing.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border bg-white p-4"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold text-black">{m.name}</p>
                  {m.item_id != null && m.quantity != null && (
                    <span className="text-sm font-semibold" style={{ color: AppColors.primary }}>
                      +{formatQty(m.quantity, itemSettings.quantityDecimals)} made
                      {m.mfg_date ? ` · ${m.mfg_date}` : ""}
                    </span>
                  )}
                </div>
                {m.raw_items?.length ? (
                  <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                    {m.raw_items
                      .map((r) => `${r.item_name} × ${formatQty(r.quantity, itemSettings.quantityDecimals)}`)
                      .join(", ")}
                  </p>
                ) : null}
                {itemSettings.description && m.description && (
                  <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                    {m.description}
                  </p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {m.total_cost != null && <span>Total cost: {formatMoney(m.total_cost)}</span>}
                  {m.unit_cost != null && <span>Purchase: {formatMoney(m.unit_cost)}</span>}
                  {itemSettings.wholesalePrice && (
                    <span>Wholesale: {formatMoney(m.wholesale_price)}</span>
                  )}
                  <span>Sale: {formatMoney(m.sale_price)}</span>
                </div>
              </div>
            ))
          )
        )}

        {!loading && !error && current.key === "categories" && (
          <>
            <div
              className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ backgroundColor: `${AppColors.lightGrey}80`, color: AppColors.greyishBlack }}
            >
              <span>Category Name</span>
              <span className="text-right">Item Count</span>
              <span />
            </div>
            {filteredCategories.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
                No categories yet. Click + Category to add one.
              </p>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-4 py-3 text-sm"
                  style={{ borderColor: AppColors.lightGrey }}
                >
                  <span className="font-medium">{category.name}</span>
                  <span style={{ color: AppColors.grey }}>
                    {itemCountsByCategory[category.name] ?? 0}
                  </span>
                  <IconButton
                    icon="delete"
                    label="Delete category"
                    variant="delete"
                    size="sm"
                    onClick={() => void handleDeleteCategory(category.id)}
                  />
                </div>
              ))
            )}
          </>
        )}

        {!loading && !error && current.key === "units" && (
          filteredUnits.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: AppColors.grey }}>
              No units yet. Click + Unit to add one.
            </p>
          ) : (
            filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="rounded-xl border bg-white p-4"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-black">{unit.name}</p>
                    <p className="text-sm" style={{ color: AppColors.grey }}>
                      Short: {unit.abbreviation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConversionOpen(true)}
                    className="shrink-0 self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#F1F5F1]"
                    style={{ borderColor: AppColors.lightGrey, color: AppColors.primary }}
                  >
                    Set conversion
                  </button>
                </div>
                {unit.conversions?.length ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {unit.conversions.map((c) => (
                      <li key={c.id} style={{ color: AppColors.greyishBlack }}>
                        {Number(c.base_unit_qty)} {c.base_unit} = {Number(c.secondary_unit_qty)} {c.secondary_unit}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs" style={{ color: AppColors.grey }}>
                    No conversions yet
                  </p>
                )}
              </div>
            ))
          )
        )}
      </div>

      {current && (
        <EntityModal
          type={current.modalType}
          open={open}
          onClose={closeModal}
          onSuccess={() => {
            showToast(current.successMsg);
            void loadTabData(current.key);
          }}
        />
      )}
      <SetConversionModal
        open={conversionOpen}
        onClose={() => setConversionOpen(false)}
        onSuccess={() => {
          showToast("Conversion saved");
          void loadTabData("units");
        }}
      />
      {Toast}
    </div>
  );
}
