"use client";

import { useCallback } from "react";
import { isRouteEnabled } from "@/constants/app-settings";
import { useSettingsStore } from "@/stores/settings-store";
import { canAccessRoute } from "@/constants/permissions";
import { useRole } from "@/hooks/use-role";

/**
 * Returns a predicate that hides menu entries switched off in General › More Transactions
 * or not available to the signed-in role.
 */
export function useRouteEnabled() {
  const general = useSettingsStore((s) => s.app.general);
  const role = useRole();
  return useCallback((href?: string) => isRouteEnabled(href, general) && canAccessRoute(href, role), [general, role]);
}
