import { Suspense } from "react";
import { SuperAdminLicensesScreen } from "@/features/super-admin/SuperAdminLicensesScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuperAdminLicensesScreen />
    </Suspense>
  );
}
