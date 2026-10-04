import { Suspense } from "react";
import { SuperAdminUsersScreen } from "@/features/super-admin/SuperAdminUsersScreen";

/** User Management with the Create User form open. */
export default function SuperAdminCreateUserPage() {
  return (
    <Suspense fallback={null}>
      <SuperAdminUsersScreen openCreate />
    </Suspense>
  );
}
