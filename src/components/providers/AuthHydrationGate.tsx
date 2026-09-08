"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/** Marks auth persist hydration complete once localStorage rehydration finishes. */
export function AuthHydrationGate({ children }: { children: React.ReactNode }) {
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated);

  useEffect(() => {
    const finish = () => setHasHydrated(true);
    const unsub = useAuthStore.persist.onFinishHydration(finish);

    if (useAuthStore.persist.hasHydrated()) {
      finish();
    }

    return unsub;
  }, [setHasHydrated]);

  return <>{children}</>;
}
