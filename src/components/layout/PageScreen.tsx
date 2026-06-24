"use client";

import { screenRegistry } from "@/lib/screen-registry";
import { isDashboardRoute, isAuthRoute } from "@/constants/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LayoutProvider } from "@/components/layout/LayoutContext";
import { useResponsive } from "@/hooks/use-responsive";

interface PageScreenProps {
  route: string;
}

function DashboardPageWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

export function PageScreen({ route }: PageScreenProps) {
  const Screen = screenRegistry[route];
  const { isWebLayout, isMobile, isTablet } = useResponsive();

  if (!Screen) {
    return (
      <LayoutProvider
        value={{ isDashboardShell: false, isDesktop: false, isTablet: false, isMobile: false }}
      >
        <div className="min-h-screen flex items-center justify-center">Screen not found: {route}</div>
      </LayoutProvider>
    );
  }

  if (isAuthRoute(route)) {
    return (
      <LayoutProvider
        value={{
          isDashboardShell: false,
          isDesktop: isWebLayout,
          isTablet,
          isMobile,
        }}
      >
        <Screen />
      </LayoutProvider>
    );
  }

  if (!isDashboardRoute(route)) {
    return (
      <LayoutProvider
        value={{ isDashboardShell: false, isDesktop: false, isTablet, isMobile }}
      >
        <Screen />
      </LayoutProvider>
    );
  }

  if (route === "/bottomBar") {
    return <Screen />;
  }

  return (
    <DashboardPageWrapper>
      <Screen />
    </DashboardPageWrapper>
  );
}
