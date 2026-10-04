"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resolveScreen } from "@/lib/screen-registry";
import { isDashboardRoute, isAuthRoute } from "@/constants/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LayoutProvider } from "@/components/layout/LayoutContext";
import { useResponsive } from "@/hooks/use-responsive";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";

/** Signed-in users are sent to the dashboard instead of seeing these screens again. */
const SIGNED_OUT_ONLY_ROUTES: string[] = [RouteName.login, RouteName.register, RouteName.welcome];

interface PageScreenProps {
  route: string;
}

function DashboardPageWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

export function PageScreen({ route }: PageScreenProps) {
  const screen = resolveScreen(route);
  const { isWebLayout, isMobile, isTablet } = useResponsive();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const redirectToDashboard = hasHydrated && Boolean(token) && SIGNED_OUT_ONLY_ROUTES.includes(route);

  useEffect(() => {
    if (redirectToDashboard) router.replace(RouteName.dashboard);
  }, [redirectToDashboard, router]);

  if (redirectToDashboard) return null;

  if (!screen) {
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
        {screen}
      </LayoutProvider>
    );
  }

  if (!isDashboardRoute(route)) {
    return (
      <LayoutProvider
        value={{ isDashboardShell: false, isDesktop: false, isTablet, isMobile }}
      >
        {screen}
      </LayoutProvider>
    );
  }

  if (route === "/dashboard") {
    return screen;
  }

  return (
    <DashboardPageWrapper>
      {screen}
    </DashboardPageWrapper>
  );
}
