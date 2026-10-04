"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { mainMenuItems } from "@/constants/menu-data";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { logoutUser } from "@/services/session-api";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useLoadingStore } from "@/stores/loading-store";
import { useRouteEnabled } from "@/hooks/use-route-enabled";

const MENU_META: Record<string, { icon: string; tint: string }> = {
  "Business Detail": { icon: "storefront", tint: "#E8F1E8" },
  Profile: { icon: "person", tint: "#E8EEF8" },
  "User Management": { icon: "manage_accounts", tint: "#F3EAF7" },
  Employee: { icon: "badge", tint: "#EAF6F1" },
  Party: { icon: "groups", tint: "#FFF4E8" },
  Sales: { icon: "point_of_sale", tint: "#E8F7F0" },
  Purchase: { icon: "shopping_cart", tint: "#F0F4FF" },
  Item: { icon: "inventory_2", tint: "#F7F0E8" },
  expense: { icon: "payments", tint: "#FDECEC" },
  Expense: { icon: "payments", tint: "#FDECEC" },
  "Cash & Bank": { icon: "account_balance", tint: "#EAF4FB" },
  "Other Income": { icon: "trending_up", tint: "#ECF8EE" },
  Utilities: { icon: "build", tint: "#F4F1EA" },
  Marketing: { icon: "campaign", tint: "#F8EAF3" },
  "Backup & Restore": { icon: "backup", tint: "#EEF2F7" },
  Calendar: { icon: "calendar_month", tint: "#EAF6F8" },
  POS: { icon: "desktop_windows", tint: "#F0F7EA" },
  "Plans & Pricing": { icon: "workspace_premium", tint: "#FFF6E5" },
  Setting: { icon: "settings", tint: "#F0F0F0" },
  "Log Out": { icon: "logout", tint: "#FDECEC" },
};

export function MainMenuScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { confirm } = useConfirm();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const isEnabled = useRouteEnabled();
  const items = mainMenuItems.filter((item) => item.title !== "Log Out" && isEnabled(item.href));
  const logoutItem = mainMenuItems.find((item) => item.title === "Log Out");

  const handleItemClick = async (index: number, href?: string, isLogout = false) => {
    setBusyIndex(index);
    try {
      if (isLogout) {
        const ok = await confirm({
          title: "Log Out",
          message: "Are you sure you want to log out?",
          confirmLabel: "Log Out",
          danger: true,
        });
        if (!ok) return;
        showLoading("Logging out...");
        try {
          await logoutUser();
        } catch {
          // Clear local session even if the API call fails.
        } finally {
          hideLoading();
        }
        logout();
        router.replace(RouteName.welcome);
        return;
      }
      if (href) router.push(href);
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Main Menu" showNotification showAvatar showBack />

      <div className="flex-1 pb-8">
        <div className="mb-5">
          <h2
            className="text-xl font-bold text-black sm:text-2xl"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Explore modules
          </h2>
          <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
            Quick access to every area of your business workspace.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item, index) => {
            const meta = MENU_META[item.title] ?? { icon: "apps", tint: "#F0F1F5" };
            const active = busyIndex === index;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => void handleItemClick(index, item.href)}
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
                  className="text-sm font-semibold capitalize leading-snug text-black sm:text-[15px]"
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

        {logoutItem && (
          <button
            type="button"
            onClick={() => void handleItemClick(mainMenuItems.length - 1, undefined, true)}
            className="mt-6 flex w-full cursor-pointer items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors hover:bg-[#FDECEC]"
            style={{
              borderColor: "#F0C9C9",
              backgroundColor: "#FFF7F7",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#FDECEC" }}
              >
                <span className="material-icons" style={{ color: AppColors.redText, fontSize: 24 }}>
                  logout
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: AppColors.redText }}>
                  Log Out
                </p>
                <p className="text-xs" style={{ color: AppColors.grey }}>
                  Sign out from this device
                </p>
              </div>
            </div>
            <span className="material-icons" style={{ color: AppColors.redText, fontSize: 20 }}>
              chevron_right
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
