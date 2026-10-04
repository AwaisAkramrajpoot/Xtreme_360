import { Suspense } from "react";
import { SuperAdminPaymentsScreen } from "@/features/super-admin/SuperAdminPaymentsScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuperAdminPaymentsScreen />
    </Suspense>
  );
}
