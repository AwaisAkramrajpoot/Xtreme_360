import { Suspense } from "react";
import { SuperAdminSupportScreen } from "@/features/super-admin/SuperAdminSupportScreen";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuperAdminSupportScreen />
    </Suspense>
  );
}
