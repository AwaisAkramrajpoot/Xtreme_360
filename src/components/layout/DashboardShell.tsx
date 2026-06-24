"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useResponsive } from "@/hooks/use-responsive";
import { useSidebarStore } from "@/stores/sidebar-store";
import { LayoutProvider } from "./LayoutContext";
import { DashboardHeader, DashboardSidebar } from "./DashboardSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { isMobile, isTablet, isWebLayout } = useResponsive();
  const { mobileOpen, setMobileOpen, collapsed } = useSidebarStore();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, setMobileOpen]);

  const layoutValue = {
    isDashboardShell: true,
    isDesktop: isWebLayout,
    isTablet,
    isMobile,
  };

  return (
    <LayoutProvider value={layoutValue}>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-[#F5F6FA]">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex shrink-0 h-full min-h-0">
          <DashboardSidebar />
        </div>

        {/* Mobile & tablet slide-in drawer */}
        <div
          className={clsx(
            "lg:hidden fixed inset-0 z-[60]",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-hidden={!mobileOpen}
        >
          {/* Backdrop */}
          <div
            className={clsx(
              "absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Drawer panel */}
          <div
            className={clsx(
              "absolute inset-y-0 left-0 flex flex-col h-dvh max-h-dvh w-[min(320px,88vw)] shadow-2xl transition-transform duration-300 ease-out will-change-transform",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <DashboardSidebar
              onNavigate={() => setMobileOpen(false)}
              isDrawer
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <DashboardHeader />
          <main
            className={clsx(
              "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
              isMobile ? "px-4 pb-[calc(75px+env(safe-area-inset-bottom))]" : "px-4 sm:px-6",
              collapsed ? "lg:px-6" : "lg:px-8",
              isMobile ? "pt-3" : "pt-4 lg:pt-6"
            )}
          >
            <div className="max-w-[1600px] mx-auto w-full min-w-0 pb-4 lg:pb-6">
              {children}
            </div>
          </main>
          {isMobile && <MobileBottomNav />}
        </div>
      </div>
    </LayoutProvider>
  );
}
