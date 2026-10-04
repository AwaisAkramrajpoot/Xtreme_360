import type { Metadata } from "next";
import { Suspense } from "react";
import { SuperAdminLoginScreen } from "@/features/super-admin/SuperAdminLoginScreen";

export const metadata: Metadata = { title: "Super Admin Sign In · Xtreme 360", robots: { index: false, follow: false } };

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <SuperAdminLoginScreen />
    </Suspense>
  );
}
