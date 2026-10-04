"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import {
  SUPER_ADMIN_STORAGE_KEY,
  hasLiveSuperAdminSession,
  useSuperAdminAuthStore,
} from "@/stores/super-admin-auth-store";
import { getPlatformSettings, getSuperAdminDashboard, getSuperAdminMe, superAdminLogout } from "@/services/super-admin-api";
import { SA, setDisplayPrefs } from "./ui";

export const SUPER_ADMIN_ROUTES = {
  login: "/super-admin/login",
  dashboard: "/super-admin/dashboard",
  companies: "/super-admin/companies",
  devices: "/super-admin/devices",
  branches: "/super-admin/branches",
  licenses: "/super-admin/licenses",
  users: "/super-admin/users",
  payments: "/super-admin/payments",
  support: "/super-admin/support",
  reports: "/super-admin/reports",
  settings: "/super-admin/settings",
} as const;

type NavItem = { href: string; label: string; icon: string; badge?: keyof Alerts };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: SUPER_ADMIN_ROUTES.dashboard, label: "Dashboard", icon: "space_dashboard" },
      { href: SUPER_ADMIN_ROUTES.reports, label: "Reports", icon: "bar_chart" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: SUPER_ADMIN_ROUTES.companies, label: "Companies", icon: "apartment" },
      { href: SUPER_ADMIN_ROUTES.branches, label: "Branches", icon: "storefront" },
      { href: SUPER_ADMIN_ROUTES.devices, label: "Devices", icon: "point_of_sale" },
      { href: SUPER_ADMIN_ROUTES.users, label: "User Management", icon: "manage_accounts", badge: "approvals" },
    ],
  },
  {
    title: "Billing",
    items: [
      { href: SUPER_ADMIN_ROUTES.licenses, label: "License Management", icon: "workspace_premium", badge: "licenses" },
      { href: SUPER_ADMIN_ROUTES.payments, label: "Payment Verification", icon: "verified_user", badge: "payments" },
    ],
  },
  {
    title: "System",
    items: [
      { href: SUPER_ADMIN_ROUTES.support, label: "Support Requests", icon: "support_agent", badge: "tickets" },
      { href: SUPER_ADMIN_ROUTES.settings, label: "Settings", icon: "settings" },
    ],
  },
];

const NAV = NAV_GROUPS.flatMap((g) => g.items);

type Alerts = { payments: number; tickets: number; approvals: number; licenses: number };

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" style={{ backgroundColor: SA.pageBg }}>
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: AppColors.primary, borderTopColor: "transparent" }}
        aria-label="Loading"
      />
    </div>
  );
}

/**
 * Wraps every protected Super Admin page. The page renders only while there is a live
 * Super Admin session; it is re-validated with the server on entry, when the tab is restored
 * from the back/forward cache and when another tab signs out.
 */
export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSuperAdminAuthStore((s) => s.token);
  const expiresAt = useSuperAdminAuthStore((s) => s.expiresAt);
  const admin = useSuperAdminAuthStore((s) => s.admin);
  const hasHydrated = useSuperAdminAuthStore((s) => s.hasHydrated);
  const setAdmin = useSuperAdminAuthStore((s) => s.setAdmin);
  const clear = useSuperAdminAuthStore((s) => s.clear);
  const [verified, setVerified] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Close menus on navigation and on Escape.
  const [menusPath, setMenusPath] = useState(pathname);
  if (menusPath !== pathname) {
    setMenusPath(pathname);
    setDrawerOpen(false);
    setBellOpen(false);
    setProfileOpen(false);
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      setBellOpen(false);
      setProfileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const live = hasLiveSuperAdminSession({ token, expiresAt });

  // No session → login (remembering where the admin was going). A deliberate logout
  // navigates on its own, to the plain login page.
  useEffect(() => {
    if (!hasHydrated || signingOut) return;
    if (!live) {
      if (token) clear("Your session has expired. Please sign in again.");
      router.replace(`${SUPER_ADMIN_ROUTES.login}?next=${encodeURIComponent(pathname || SUPER_ADMIN_ROUTES.dashboard)}`);
    }
  }, [hasHydrated, signingOut, live, token, clear, router, pathname]);

  // Confirm the token with the server once per page load (a 401 clears it via the API client,
  // which sends the admin back to login; network errors keep the cached session).
  useEffect(() => {
    if (!hasHydrated || !live || verified) return;
    let cancelled = false;
    getSuperAdminMe()
      .then((me) => {
        if (!cancelled) {
          setAdmin(me);
          setVerified(true);
        }
      })
      .catch(() => {
        if (!cancelled) setVerified(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, live, verified, setAdmin]);

  // Back/forward cache restore after logout, and logout in another tab.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void useSuperAdminAuthStore.persist.rehydrate();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SUPER_ADMIN_STORAGE_KEY) void useSuperAdminAuthStore.persist.rehydrate();
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Bell: things waiting for the admin, refreshed on every navigation.
  useEffect(() => {
    if (!live || !verified) return;
    let cancelled = false;
    getSuperAdminDashboard()
      .then((d) => {
        if (cancelled) return;
        setAlerts({
          payments: d.totals.pending_payments,
          tickets: d.totals.open_tickets,
          approvals: d.totals.pending_approvals ?? 0,
          licenses: d.expiring_licenses.length,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [live, verified, pathname]);

  // Date format and time zone from Settings › General.
  useEffect(() => {
    if (!live || !verified) return;
    getPlatformSettings()
      .then((s) => setDisplayPrefs({ dateFormat: s.general.date_format, timeZone: s.general.time_zone }))
      .catch(() => undefined);
  }, [live, verified]);

  const logout = async () => {
    setSigningOut(true);
    try {
      await superAdminLogout();
    } catch {
      /* the local session is cleared either way */
    }
    clear();
    router.replace(SUPER_ADMIN_ROUTES.login);
  };

  if (!hasHydrated || !live || !verified) return <FullScreenLoader />;

  const totalAlerts = alerts ? alerts.payments + alerts.tickets + alerts.approvals + alerts.licenses : 0;

  const displayName = admin?.name?.trim() || "Super Admin";
  const initials =
    displayName
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";

  const isActive = (href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  const current = NAV.find((item) => isActive(item.href));

  const avatar = (size: number) => (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), backgroundColor: AppColors.primary }}
      aria-hidden
    >
      {initials}
    </span>
  );

  const sidebar = (
    <nav className="flex h-full flex-col bg-white" aria-label="Super Admin">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-5" style={{ borderColor: SA.border }}>
        <AppAsset src={AppImages.logo} width={96} height={40} className="h-9 w-auto object-contain" />
        <span
          className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: SA.accentSoft, color: AppColors.primary }}
        >
          Admin
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: SA.subtle }}>
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const count = item.badge && alerts ? alerts[item.badge] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
                        active ? "font-semibold" : "font-medium hover:bg-[#F4F6F4]"
                      )}
                      style={{ backgroundColor: active ? SA.accentSoft : undefined, color: active ? AppColors.primary : SA.textSoft }}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: AppColors.primary }} aria-hidden />
                      )}
                      <span aria-hidden className="material-icons text-[19px]" style={{ color: active ? AppColors.primary : SA.subtle }}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {count ? (
                        <span
                          className="min-w-[20px] rounded-full px-1.5 text-center text-[10.5px] font-semibold leading-5"
                          style={{ backgroundColor: active ? AppColors.primary : "#FDECEC", color: active ? "#fff" : "#C62828" }}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t p-3" style={{ borderColor: SA.border }}>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          {avatar(36)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold" style={{ color: SA.text }}>
              {displayName}
            </p>
            <p className="truncate text-[11px]" style={{ color: SA.muted }}>
              {admin?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={signingOut}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            style={{ color: SA.muted }}
            title="Log out"
            aria-label="Log out"
          >
            <span aria-hidden className="material-icons text-[19px]">logout</span>
          </button>
        </div>
      </div>
    </nav>
  );

  const alertItems = [
    { label: "Payments awaiting verification", count: alerts?.payments ?? 0, href: `${SUPER_ADMIN_ROUTES.payments}?status=pending`, icon: "payments" },
    { label: "Open support tickets", count: alerts?.tickets ?? 0, href: `${SUPER_ADMIN_ROUTES.support}?status=open`, icon: "support_agent" },
    { label: "Licenses expiring soon", count: alerts?.licenses ?? 0, href: `${SUPER_ADMIN_ROUTES.licenses}?status=expiring`, icon: "schedule" },
    { label: "Accounts awaiting approval", count: alerts?.approvals ?? 0, href: `${SUPER_ADMIN_ROUTES.users}?status=pending`, icon: "how_to_reg" },
  ];

  return (
    // Fixed-height app shell: only <main> scrolls, so the header is never pushed up or clipped.
    <div className="flex h-dvh w-full overflow-clip" style={{ backgroundColor: SA.pageBg }}>
      <aside className="hidden h-full w-[248px] shrink-0 border-r lg:block" style={{ borderColor: SA.border }}>
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[264px] max-w-[85vw] shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header
          className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-white px-4 sm:px-6"
          style={{ borderColor: SA.border }}
        >
          <button
            type="button"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-50 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span aria-hidden className="material-icons" style={{ color: SA.text }}>menu</span>
          </button>

          <div className="min-w-0 shrink-0">
            <p className="hidden text-[11px] leading-4 sm:block" style={{ color: SA.muted }}>
              Super Admin <span aria-hidden>/</span> {current?.label ?? "Dashboard"}
            </p>
            <p className="truncate text-[15px] font-semibold leading-5" style={{ color: SA.text }}>
              {current?.label ?? "Dashboard"}
            </p>
          </div>

          <form
            className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border px-3 transition-colors focus-within:border-[#588157] focus-within:bg-white md:flex"
            style={{ backgroundColor: SA.pageBg, borderColor: SA.border }}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              router.push(q ? `${SUPER_ADMIN_ROUTES.companies}?search=${encodeURIComponent(q)}` : SUPER_ADMIN_ROUTES.companies);
            }}
          >
            <span className="material-icons text-[19px]" style={{ color: SA.muted }} aria-hidden>
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies…"
              aria-label="Search companies"
              className="h-full w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#9AA0AE]"
              style={{ color: SA.text }}
            />
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBellOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: SA.border }}
                aria-label={`Notifications: ${totalAlerts} waiting`}
                aria-expanded={bellOpen}
                aria-haspopup="menu"
              >
                <span aria-hidden className="material-icons text-[21px]" style={{ color: SA.textSoft }}>
                  notifications_none
                </span>
                {totalAlerts ? (
                  <span className="absolute right-1 top-1 min-w-[17px] rounded-full bg-red-500 px-1 text-center text-[9.5px] font-semibold leading-[17px] text-white ring-2 ring-white">
                    {totalAlerts > 99 ? "99+" : totalAlerts}
                  </span>
                ) : null}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} aria-hidden />
                  <div
                    className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white shadow-xl"
                    style={{ borderColor: SA.border }}
                    role="menu"
                  >
                    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: SA.border }}>
                      <p className="text-sm font-semibold" style={{ color: SA.text }}>
                        Notifications
                      </p>
                      <span className="text-xs" style={{ color: SA.muted }}>
                        {totalAlerts ? `${totalAlerts} need attention` : "All caught up"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      {alertItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setBellOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] hover:bg-gray-50"
                          style={{ color: SA.text }}
                        >
                          <span
                            aria-hidden
                            className="material-icons flex h-8 w-8 items-center justify-center rounded-lg text-[18px]"
                            style={{ backgroundColor: SA.iconBox, color: SA.textSoft }}
                          >
                            {item.icon}
                          </span>
                          <span className="flex-1">{item.label}</span>
                          <span
                            className="min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-5"
                            style={{ backgroundColor: item.count ? "#FDECEC" : SA.iconBox, color: item.count ? "#C62828" : SA.muted }}
                          >
                            {item.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="mx-1 hidden h-8 w-px sm:block" style={{ backgroundColor: SA.border }} aria-hidden />

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setBellOpen(false);
                }}
                className="flex h-11 items-center gap-2.5 rounded-lg px-1 transition-colors hover:bg-gray-50 sm:pr-2"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                {avatar(34)}
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-[140px] truncate text-[13px] font-semibold leading-4" style={{ color: SA.text }}>
                    {displayName}
                  </span>
                  <span className="block text-[11px] leading-4" style={{ color: SA.muted }}>
                    Super Admin
                  </span>
                </span>
                <span aria-hidden className="material-icons hidden text-[18px] sm:block" style={{ color: SA.muted }}>
                  expand_more
                </span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
                  <div
                    className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-white shadow-xl"
                    style={{ borderColor: SA.border }}
                    role="menu"
                  >
                    <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: SA.border }}>
                      {avatar(40)}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: SA.text }}>
                          {displayName}
                        </p>
                        <p className="truncate text-xs" style={{ color: SA.muted }}>
                          {admin?.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={SUPER_ADMIN_ROUTES.settings}
                        role="menuitem"
                        className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] hover:bg-gray-50"
                        style={{ color: SA.text }}
                      >
                        <span aria-hidden className="material-icons text-[19px]" style={{ color: SA.muted }}>settings</span>
                        Settings
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void logout()}
                        disabled={signingOut}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <span aria-hidden className="material-icons text-[19px]">logout</span>
                        {signingOut ? "Signing out…" : "Log out"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
