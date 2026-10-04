"use client";

import { normalizeRole, type Role } from "@/constants/permissions";
import { useSessionProfileStore } from "@/stores/session-profile-store";

/** Role of the signed-in person (owner until the profile says otherwise). */
export function useRole(): Role {
  return normalizeRole(useSessionProfileStore((s) => s.user?.role));
}
