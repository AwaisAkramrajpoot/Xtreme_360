"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppColors } from "@/constants/colors";
import { useLoadingStore } from "@/stores/loading-store";

export function GlobalLoadingOverlay() {
  const count = useLoadingStore((s) => s.count);
  const message = useLoadingStore((s) => s.message);
  const visible = count > 0;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
      <div className="flex min-w-[160px] flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: AppColors.primary, borderTopColor: "transparent" }}
        />
        <p className="text-sm font-medium text-black" style={{ fontFamily: "var(--font-poppins)" }}>
          {message || "Loading..."}
        </p>
      </div>
    </div>
  );
}

/**
 * Thin progress bar shown briefly on client route changes. It never blocks input, so
 * navigation feels instant; blocking loaders are reserved for real API work (useLoadingStore).
 */
export function RouteLoadingBridge() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const show = window.setTimeout(() => setVisible(true), 0);
    const hide = window.setTimeout(() => setVisible(false), 450);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [pathname]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[400] h-0.5 overflow-hidden" aria-hidden>
      <div className="route-progress h-full" style={{ backgroundColor: AppColors.primary }} />
    </div>
  );
}
