"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { quickMenuItems } from "@/constants/menu-data";

const QUICK_MENU_META: Record<string, { icon: string; tint: string }> = {
  Quotation:        { icon: "request_quote",   tint: "#E8F1E8" },
  "Sales Order":    { icon: "shopping_bag",    tint: "#E8EEF8" },
  "Payment In":     { icon: "payments",        tint: "#EAF6F1" },
  "Delivery Note":  { icon: "local_shipping",  tint: "#F0F4FF" },
  "Sales Return":   { icon: "assignment_return", tint: "#F7F0E8" },
  Expenses:         { icon: "receipt_long",    tint: "#FDECEC" },
  Purchase:         { icon: "shopping_cart",   tint: "#F3EAF7" },
  "Purchased Order":{ icon: "inventory",       tint: "#FFF4E8" },
  "Payment Out":    { icon: "money_off",       tint: "#F0F7EA" },
  "Purchased Return":{ icon: "keyboard_return", tint: "#EAF4FB" },
  "Bank Account":   { icon: "account_balance", tint: "#EAF6F8" },
  "Cash Account":   { icon: "account_balance_wallet", tint: "#ECF8EE" },
};

export function QuickMenuScreen() {
  const router = useRouter();
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const handleClick = async (index: number, href?: string) => {
    setBusyIndex(index);
    try {
      if (href) router.push(href);
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-[#F7F8FB]">
      <AppAppBar title="Quick Menu" showNotification showSearch />

      <div className="flex-1 px-1 pb-8 pt-4 sm:px-2">
        <div className="mb-5">
          <h2
            className="text-xl font-bold text-black sm:text-2xl"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Quick actions
          </h2>
          <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
            Jump directly to your most-used transactions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {quickMenuItems.map((item, index) => {
            const meta = QUICK_MENU_META[item.title] ?? { icon: "bolt", tint: "#F0F1F5" };
            const active = busyIndex === index;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => void handleClick(index, item.href)}
                className="group flex cursor-pointer flex-col items-start rounded-2xl border bg-white p-4 text-left shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#58815766] hover:shadow-[0_10px_24px_rgba(88,129,87,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]"
                style={{
                  borderColor: AppColors.lightGrey,
                  opacity: active ? 0.75 : 1,
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: meta.tint }}
                >
                  <span
                    className="material-icons"
                    style={{ color: AppColors.primary, fontSize: 26 }}
                  >
                    {meta.icon}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold leading-snug text-black sm:text-[15px]"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {item.title}
                </span>
                <span
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: AppColors.primary }}
                >
                  Open
                  <span className="material-icons" style={{ fontSize: 14 }}>
                    arrow_forward
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
