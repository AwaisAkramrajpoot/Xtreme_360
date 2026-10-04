"use client";

import { AuthHydrationGate } from "@/components/providers/AuthHydrationGate";
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import {
  GlobalLoadingOverlay,
  RouteLoadingBridge,
} from "@/components/providers/GlobalLoadingOverlay";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      <AuthHydrationGate>
        <RouteLoadingBridge />
        {children}
        <GlobalLoadingOverlay />
      </AuthHydrationGate>
    </ConfirmProvider>
  );
}
