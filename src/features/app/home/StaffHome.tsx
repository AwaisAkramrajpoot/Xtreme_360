"use client";

import Link from "next/link";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { useRouteEnabled } from "@/hooks/use-route-enabled";
import { useSessionProfileStore } from "@/stores/session-profile-store";

const SHORTCUTS = [
  { title: "Sales Invoice", icon: "receipt_long", href: RouteName.salesInvoice, text: "Create and manage invoices" },
  { title: "POS", icon: "point_of_sale", href: RouteName.pos, text: "Quick counter billing" },
  { title: "Quotation", icon: "request_quote", href: RouteName.quotation, text: "Estimates for customers" },
  { title: "Sales Order", icon: "shopping_bag", href: RouteName.saleOrder, text: "Customer orders" },
  { title: "Payment In", icon: "payments", href: RouteName.paymentIn, text: "Record received payments" },
  { title: "Parties", icon: "groups", href: RouteName.party, text: "Customers and suppliers" },
  { title: "Items", icon: "inventory_2", href: RouteName.itemManagement, text: "Prices and stock" },
  { title: "Calendar", icon: "calendar_month", href: RouteName.calendar, text: "Events and follow-ups" },
];

/** Home for the staff role, which has no access to business-wide financial totals. */
export function StaffHome() {
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const isEnabled = useRouteEnabled();

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle={business?.name ? `You're working in ${business.name}` : "Your workspace"}
        showAvatar
      />
      <div className="grid grid-cols-1 gap-3 pb-10 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUTS.filter((s) => isEnabled(s.href)).map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(88,129,87,0.12)]"
            style={{ borderColor: AppColors.lightGrey }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#EAF2EA", color: AppColors.primary }}>
              <span className="material-icons text-[22px]" aria-hidden>{s.icon}</span>
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-black">{s.title}</span>
              <span className="block text-xs" style={{ color: AppColors.grey }}>{s.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
