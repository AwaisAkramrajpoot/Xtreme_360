"use client";

import Link from "next/link";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";

/** Shown when the signed-in role opens a page it can't use (e.g. via a bookmarked link). */
export function NoAccess({ requiredRole }: { requiredRole: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FDECEC", color: AppColors.redText }}>
        <span className="material-icons text-[28px]" aria-hidden>lock</span>
      </span>
      <h1 className="text-xl font-bold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
        You don&apos;t have access to this page
      </h1>
      <p className="max-w-sm text-sm" style={{ color: AppColors.grey }}>
        It requires the {requiredRole} role. Ask the business owner if you need it.
      </p>
      <Link
        href={RouteName.dashboard}
        className="mt-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: AppColors.primary }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
