"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { HomeScreen } from "@/features/app/home/HomeScreen";

export function BottomBarLayout() {
  return (
    <DashboardShell>
      <HomeScreen />
    </DashboardShell>
  );
}
