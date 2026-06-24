"use client";

import { createContext, useContext } from "react";

interface LayoutContextValue {
  isDashboardShell: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextValue>({
  isDashboardShell: false,
  isDesktop: false,
  isTablet: false,
  isMobile: false,
});

export function LayoutProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LayoutContextValue;
}) {
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutContext() {
  return useContext(LayoutContext);
}
