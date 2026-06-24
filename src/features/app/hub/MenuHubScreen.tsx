"use client";

import { salesItems, purchaseItems, cashBankItems, utilitiesItems, backupAndRestoreItems, marketingItems } from "@/constants/menu-data";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppTile } from "@/components/ui/AppTile";
import { AppColors } from "@/constants/colors";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/constants/menu-data";

interface MenuHubScreenProps {
  title: string;
  items: MenuItem[];
  showAdd?: boolean;
  showArrow?: boolean;
  tileStyle?: "default" | "primary" | "cashBank";
  showNewOnFirst?: number;
}

export function MenuHubScreen({
  title,
  items,
  showAdd = true,
  showArrow,
  tileStyle = "default",
  showNewOnFirst,
}: MenuHubScreenProps) {
  const router = useRouter();
  const { isDashboardShell } = useLayoutContext();

  return (
    <div className="flex flex-col">
      <AppAppBar title={title} showNotification showSearch showBack={!isDashboardShell} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 py-2 min-w-0">
        {items.map((item, index) => {
          if (tileStyle === "cashBank") {
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => item.href && router.push(item.href)}
                className="rounded-xl p-4 text-left hover:shadow-md transition-shadow bg-white border"
                style={{ borderColor: AppColors.lightGrey }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold" style={{ fontFamily: "var(--font-poppins)" }}>
                    {item.title}
                  </span>
                  <span className="material-icons text-black" style={{ fontSize: 22 }}>add</span>
                </div>
              </button>
            );
          }

          const isPrimary = tileStyle === "primary";
          return (
            <AppTile
              key={item.title}
              title={item.title}
              leading={item.image}
              showAdd={showAdd && !showArrow}
              showArrow={showArrow}
              showNew={showNewOnFirst !== undefined && index < showNewOnFirst}
              bgColor={isPrimary ? AppColors.primary : AppColors.white}
              fgColor={isPrimary ? AppColors.white : AppColors.black}
              onClick={() => item.href && router.push(item.href)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SalesScreen() {
  return <MenuHubScreen title="Sales" items={salesItems} />;
}

export function PurchaseScreen() {
  return <MenuHubScreen title="Purchase" items={purchaseItems} />;
}

export function CashBankScreen() {
  return <MenuHubScreen title="Cash & Bank" items={cashBankItems} tileStyle="cashBank" />;
}

export function UtilitiesScreen() {
  return <MenuHubScreen title="Utilities" items={utilitiesItems} />;
}

export function MarketingScreen() {
  return <MenuHubScreen title="Marketing" items={marketingItems} showAdd={false} />;
}

export function BackupAndRestoreScreen() {
  return <MenuHubScreen title="Backup & Restore" items={backupAndRestoreItems} showAdd={false} />;
}
