"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { AddLabelButton } from "@/components/ui/AddLabelButton";
import { EntityModal } from "@/components/modals/EntityModal";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import type { EntityModalType } from "@/components/modals";
import {
  deleteItemCategory,
  getItemCategories,
  getItems,
  type ItemCategoryRecord,
  type ItemRecord,
} from "@/services/item-api";
import { getUnitsOverview, type UnitOverviewRecord } from "@/services/unit-api";
import { getManufacturing, type ManufacturingRecord } from "@/services/manufacturing-api";
import { IconButton } from "@/components/ui/IconButton";
import { getApiErrorMessage } from "@/utils/api-error";

const TABS = [
  { label: "Products", modalType: "product" as EntityModalType, addLabel: "Product", successMsg: "Product saved successfully!" },
  { label: "Services", modalType: "service" as EntityModalType, addLabel: "Service", successMsg: "Service saved successfully!" },
  { label: "Manufacturing", modalType: "manufacturing" as EntityModalType, addLabel: "Manufacturing", successMsg: "Manufacturing saved successfully!" },
  { label: "Categories", modalType: "category" as EntityModalType, addLabel: "Category", successMsg: "Category saved successfully!" },
  { label: "Units", modalType: "unit" as EntityModalType, addLabel: "Unit", successMsg: "Unit saved successfully!" },
];

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs 0";
  return `Rs ${amount.toLocaleString()}`;
}

export function ItemManagementScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ItemRecord[]>([]);
  const [services, setServices] = useState<ItemRecord[]>([]);
  const [manufacturing, setManufacturing] = useState<ManufacturingRecord[]>([]);
  const [categories, setCategories] = useState<ItemCategoryRecord[]>([]);
  const [units, setUnits] = useState<UnitOverviewRecord[]>([]);
  const [itemCountsByCategory, setItemCountsByCategory] = useState<Record<string, number>>({});

  const { isDashboardShell } = useLayoutContext();
  const { open, openModal, closeModal } = useModal();
  const { showToast, Toast } = useToast();
  const current = TABS[activeTab];

  const loadTabData = useCallback(async (tabIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      if (tabIndex === 0) {
        const rows = await getItems("product");
        setProducts(rows);
      } else if (tabIndex === 1) {
        const rows = await getItems("service");
        setServices(rows);
      } else if (tabIndex === 2) {
        const rows = await getManufacturing();
        setManufacturing(rows);
      } else if (tabIndex === 3) {
        const [categoryRows, allItems] = await Promise.all([getItemCategories(), getItems()]);
        const counts: Record<string, number> = {};
        for (const item of allItems) {
          const key = (item.item_category || "Uncategorized").trim() || "Uncategorized";
          counts[key] = (counts[key] || 0) + 1;
        }
        setCategories(categoryRows);
        setItemCountsByCategory(counts);
      } else if (tabIndex === 4) {
        const rows = await getUnitsOverview();
        setUnits(rows);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to load ${TABS[tabIndex].label.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTabData(activeTab);
  }, [activeTab, loadTabData]);

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
    return services.filter((s) => s.item_name?.toLowerCase().includes(q));
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
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteItemCategory(categoryId);
      showToast("Category deleted successfully!");
      await loadTabData(3);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete category"));
    }
  };

  return (
    <div className="flex flex-col">
      <AppAppBar title="Items" showNotification showBack={!isDashboardShell} showAvatar />

      <div className="flex overflow-x-auto border-b" style={{ borderColor: AppColors.lightGrey }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setSearch("");
              setActiveTab(i);
            }}
            className="px-4 py-3 text-[15px] font-semibold whitespace-nowrap shrink-0"
            style={{
              color: activeTab === i ? AppColors.primary : AppColors.greyishBlack,
              borderBottom: activeTab === i ? `2px solid ${AppColors.primary}` : "2px solid transparent",
              fontFamily: "var(--font-poppins)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 flex gap-4 items-center">
        <div
          className="flex-1 h-12 flex items-center gap-2 px-4 rounded-lg"
          style={{ backgroundColor: AppColors.lightGrey }}
        >
          <span className="material-icons text-xl" style={{ color: AppColors.greyishBlack }}>search</span>
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

      <div className="px-5 pb-6 space-y-3">
        {loading && (
          <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
            Loading {current.label.toLowerCase()}...
          </p>
        )}

        {!loading && error && <p className="text-sm text-center py-8 text-red-500">{error}</p>}

        {!loading && !error && activeTab === 0 && (
          filteredProducts.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
              No products yet. Click + Product to add one.
            </p>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white rounded-xl border"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <p className="font-bold text-black">{p.item_name}</p>
                <p className="text-sm" style={{ color: AppColors.grey }}>
                  Category: {p.item_category || "—"}
                  {p.item_unit ? ` · Unit: ${p.item_unit}` : ""}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                  <span>Purchase: {formatMoney(p.purchase_price)}</span>
                  <span>Sale: {formatMoney(p.sale_price)}</span>
                  <span>Qty: {p.opening_stock ?? 0}</span>
                </div>
              </div>
            ))
          )
        )}

        {!loading && !error && activeTab === 1 && (
          filteredServices.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
              No services yet. Click + Service to add one.
            </p>
          ) : (
            filteredServices.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-white rounded-xl border"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <p className="font-bold text-black">{s.item_name}</p>
                <p className="text-sm mt-1">Price: {formatMoney(s.sale_price)}</p>
              </div>
            ))
          )
        )}

        {!loading && !error && activeTab === 2 && (
          filteredManufacturing.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
              No manufacturing yet. Click + Manufacturing to add one.
            </p>
          ) : (
            filteredManufacturing.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-white rounded-xl border"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <p className="font-bold text-black">{m.name}</p>
                {m.description && (
                  <p className="text-sm mt-1" style={{ color: AppColors.grey }}>
                    {m.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <span>Sale: {formatMoney(m.sale_price)}</span>
                  <span>Wholesale: {formatMoney(m.wholesale_price)}</span>
                </div>
                {!!m.raw_items?.length && (
                  <p className="text-xs mt-2" style={{ color: AppColors.grey }}>
                    Raw items: {m.raw_items.length}
                  </p>
                )}
              </div>
            ))
          )
        )}

        {!loading && !error && activeTab === 3 && (
          <>
            <div
              className="px-4 py-3 rounded-lg text-sm font-semibold grid grid-cols-[1fr_auto_auto] gap-3"
              style={{ backgroundColor: `${AppColors.lightGrey}80`, color: AppColors.greyishBlack }}
            >
              <span>Category Name</span>
              <span className="text-right">Item Count</span>
              <span />
            </div>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
                No categories yet. Click + Category to add one.
              </p>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="px-4 py-3 border-b grid grid-cols-[1fr_auto_auto] gap-3 items-center text-sm"
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

        {!loading && !error && activeTab === 4 && (
          filteredUnits.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
              No units yet. Click + Unit to add one.
            </p>
          ) : (
            filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="p-4 bg-white rounded-xl border"
                style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold text-black">{unit.name}</p>
                    <p className="text-sm" style={{ color: AppColors.grey }}>
                      Short: {unit.abbreviation}
                    </p>
                  </div>
                  <p className="text-sm" style={{ color: AppColors.grey }}>
                    {unit.conversions_count || 0} conversion{(unit.conversions_count || 0) === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <EntityModal
        type={current.modalType}
        open={open}
        onClose={closeModal}
        onSuccess={() => {
          showToast(current.successMsg);
          void loadTabData(activeTab);
        }}
      />
      {Toast}
    </div>
  );
}
