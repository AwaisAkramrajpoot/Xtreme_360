import { Suspense } from "react";
import { SuperAdminUsersScreen } from "@/features/super-admin/SuperAdminUsersScreen";

export default function SuperAdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <SuperAdminUsersScreen />
    </Suspense>
  );
}
