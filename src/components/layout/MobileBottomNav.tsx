"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppColors } from "@/constants/colors";
import { bottomBarItems, useBottomBarStore } from "@/stores/bottom-bar-store";
import { bottomNavRoutes, isDashboardRoute } from "@/constants/navigation";

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentIndex, setIndex } = useBottomBarStore();

  const getActiveIndex = () => {
    const idx = bottomNavRoutes.findIndex((href) => {
      if (href === "/bottomBar") return pathname === "/bottomBar";
      return pathname === href || pathname.startsWith(href + "/");
    });
    return idx >= 0 ? idx : currentIndex;
  };

  const activeIndex = getActiveIndex();

  const handleNav = (index: number) => {
    setIndex(index);
    const href = bottomNavRoutes[index];
    if (href) router.push(href);
  };

  if (!isDashboardRoute(pathname)) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: AppColors.bgColor, borderRadius: "24px 24px 0 0" }}
    >
      <div className="h-[75px] px-1.5 sm:px-2.5 py-2.5 flex items-center justify-around safe-area-bottom">
        {bottomBarItems.map((item, index) => {
          const selected = activeIndex === index;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNav(index)}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 px-0.5"
            >
              <AppAsset src={item.icon} width={26} height={26} className="shrink-0" />
              <span
                className="text-[9px] sm:text-[10px] truncate max-w-full leading-tight text-center"
                style={{
                  color: selected ? AppColors.primary : "#757575",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
