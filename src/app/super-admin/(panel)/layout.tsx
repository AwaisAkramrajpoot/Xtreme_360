import type { Metadata } from "next";
import { SuperAdminShell } from "@/features/super-admin/SuperAdminShell";

export const metadata: Metadata = { title: "Super Admin · Xtreme 360", robots: { index: false, follow: false } };

/** Every page in this group requires a Super Admin session (checked in SuperAdminShell and by the API). */
export default function SuperAdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
