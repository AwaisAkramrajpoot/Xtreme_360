"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppTile } from "@/components/ui/AppTile";
import { AppColors } from "@/constants/colors";
import { mainMenuItems } from "@/constants/menu-data";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";

export function MainMenuScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-white flex flex-col">
      <AppAppBar title="Main Menu" showNotification showAvatar />
      <div className="flex-1 py-4">
        {mainMenuItems.map((item, index) => {
          const isLogout = index === mainMenuItems.length - 1;
          return (
            <AppTile
              key={item.title}
              title={item.title}
              leading={item.image}
              showArrow
              bgColor={selectedIndex === index ? AppColors.primary : AppColors.bgColor2}
              fgColor={selectedIndex === index ? AppColors.white : AppColors.black}
              onClick={async () => {
                setSelectedIndex(index);
                if (isLogout) {
                  if (confirm("Are you sure you want to log out?")) {
                    logout();
                    router.replace(RouteName.welcome);
                  }
                  return;
                }
                await new Promise((r) => setTimeout(r, 100));
                if (item.href) router.push(item.href);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
