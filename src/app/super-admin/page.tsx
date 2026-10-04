import { redirect } from "next/navigation";

/** /super-admin → dashboard (the panel layout sends signed-out visitors to the login page). */
export default function SuperAdminIndexPage() {
  redirect("/super-admin/dashboard");
}
