"use client";

import { useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { AddLabelButton } from "@/components/ui/AddLabelButton";
import { EntityModal } from "@/components/modals/EntityModal";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import type { EntityModalType } from "@/components/modals";

const TABS = [
  { label: "Products", modalType: "product" as EntityModalType, addLabel: "Product", successMsg: "Product saved successfully!" },
  { label: "Services", modalType: "service" as EntityModalType, addLabel: "Service", successMsg: "Service saved successfully!" },
  { label: "Manufacturing", modalType: "product" as EntityModalType, addLabel: "Manufacturing", successMsg: "Manufacturing saved successfully!" },
  { label: "Categories", modalType: "category" as EntityModalType, addLabel: "Category", successMsg: "Category saved successfully!" },
  { label: "Units", modalType: "unit" as EntityModalType, addLabel: "Unit", successMsg: "Unit saved successfully!" },
];

const SAMPLE_PRODUCTS = [
  { name: "2U Rack China", category: "Mix", purchase: "Rs 2800", sale: "Rs 3500", qty: "10" },
];

export function ItemManagementScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const { isDashboardShell } = useLayoutContext();
  const { open, openModal, closeModal } = useModal();
  const { showToast, Toast } = useToast();
  const current = TABS[activeTab];

  return (
    <div className="flex flex-col">
      <AppAppBar title="Items" showNotification showBack={!isDashboardShell} showAvatar />

      <div className="flex overflow-x-auto border-b" style={{ borderColor: AppColors.lightGrey }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(i)}
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
            placeholder={`Search ${current.label}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#64646499]"
          />
        </div>
        <AddLabelButton label={current.addLabel} onClick={openModal} />
      </div>

      <div className="px-5 pb-6 space-y-3">
        {activeTab === 0 &&
          SAMPLE_PRODUCTS.map((p) => (
            <div key={p.name} className="p-4 bg-white rounded-xl border" style={{ borderColor: AppColors.lightGrey, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <p className="font-bold text-black">{p.name}</p>
              <p className="text-sm" style={{ color: AppColors.grey }}>Category: {p.category}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                <span>Purchase: {p.purchase}</span>
                <span>Sale: {p.sale}</span>
                <span>Qty: {p.qty}</span>
              </div>
            </div>
          ))}
        {activeTab === 3 && (
          <>
            <div className="px-4 py-3 rounded-lg text-sm font-semibold grid grid-cols-2" style={{ backgroundColor: `${AppColors.lightGrey}80`, color: AppColors.greyishBlack }}>
              <span>Category Name</span>
              <span className="text-right">Item Count</span>
            </div>
            {["Items Not Any Category", "Mix", "Switch"].map((name, i) => (
              <div key={name} className="px-4 py-3 border-b flex justify-between text-sm" style={{ borderColor: AppColors.lightGrey }}>
                <span className="font-medium">{name}</span>
                <span style={{ color: AppColors.grey }}>{["386", "1", "1"][i]}</span>
              </div>
            ))}
          </>
        )}
        {activeTab !== 0 && activeTab !== 3 && (
          <p className="text-sm text-center py-8" style={{ color: AppColors.grey }}>
            No {current.label.toLowerCase()} yet. Click + {current.addLabel} to add one.
          </p>
        )}
      </div>

      <EntityModal
        type={current.modalType}
        open={open}
        onClose={closeModal}
        onSuccess={() => showToast(current.successMsg)}
      />
      {Toast}
    </div>
  );
}
