"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppTile } from "@/components/ui/AppTile";
import { AppColors } from "@/constants/colors";
import { quickMenuItems } from "@/constants/menu-data";

export function QuickMenuScreen() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-white flex flex-col">
      <AppAppBar title="Quick menu" showNotification showSearch />
      <div className="flex-1 py-4">
        {quickMenuItems.map((item, index) => (
          <AppTile
            key={item.title}
            title={item.title}
            showArrow
            bgColor={selectedIndex === index ? AppColors.primary : AppColors.bgColor2}
            fgColor={selectedIndex === index ? AppColors.white : AppColors.black}
            onClick={async () => {
              setSelectedIndex(index);
              await new Promise((r) => setTimeout(r, 100));
              if (item.href) router.push(item.href);
            }}
          />
        ))}
      </div>
    </div>
  );
}
