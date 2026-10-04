import { Suspense } from "react";
import { SuperAdminCompaniesScreen } from "@/features/super-admin/SuperAdminCompaniesScreen";

export default function SuperAdminCompaniesPage() {
  return (
    <Suspense fallback={null}>
      <SuperAdminCompaniesScreen />
    </Suspense>
  );
}
