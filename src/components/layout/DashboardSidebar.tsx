"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import {
  primaryNavItems,
  accountNavItems,
  moduleNavItems,
  systemNavItems,
  allSidebarNavItems,
  type NavItem,
} from "@/constants/navigation";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { RouteName } from "@/constants/routes";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { useResponsive } from "@/hooks/use-responsive";
import { logoutUser } from "@/services/session-api";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useLoadingStore } from "@/stores/loading-store";
import { useRouteEnabled } from "@/hooks/use-route-enabled";

/**
 * Only the most specific matching item is active, so "Main Menu" (/main-menu) does not
 * light up together with "Sales" (/main-menu/sales) and every other module.
 */
function activeNavHref(pathname: string) {
  let best = "";
  for (const { href } of allSidebarNavItems) {
    const matches =
      href === RouteName.dashboard ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    if (matches && href.length > best.length) best = href;
  }
  return best;
}

function isNavActive(pathname: string, href: string) {
  return activeNavHref(pathname) === href;
}

function NavLink({
  item,
  collapsed,
  active,
  isDrawer,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  isDrawer?: boolean;
  onClick?: () => void;
}) {
  const showLabel = !collapsed;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 px-3 rounded-lg transition-colors text-sm font-medium min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]",
        isDrawer ? "py-2.5" : "py-2.5",
        active ? "text-white" : "text-[#646464] hover:bg-black/5"
      )}
      style={{
        backgroundColor: active ? AppColors.primary : "transparent",
        fontFamily: "var(--font-poppins)",
      }}
    >
      <AppAsset
        src={item.icon}
        width={20}
        height={20}
        className="shrink-0"
        style={{
          filter: active ? "brightness(0) invert(1)" : undefined,
        }}
      />
      {showLabel && (
        <span
          className={clsx(
            "flex-1 min-w-0 leading-snug",
            isDrawer ? "whitespace-normal break-words" : "truncate"
          )}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  items,
  collapsed,
  pathname,
  isDrawer,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  isDrawer?: boolean;
  onNavigate?: () => void;
}) {
  const isEnabled = useRouteEnabled();
  const visibleItems = items.filter((item) => isEnabled(item.href));
  return (
    <div className="mb-3 last:mb-0 shrink-0">
      {!collapsed && (
        <p
          className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider leading-tight"
          style={{ color: AppColors.grey }}
        >
          {title}
        </p>
      )}
      <div className="space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={`${item.href}-${item.label}`}
            item={item}
            collapsed={collapsed}
            active={isNavActive(pathname, item.href)}
            isDrawer={isDrawer}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  onNavigate?: () => void;
  isDrawer?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ onNavigate, isDrawer, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebarStore();
  const logout = useAuthStore((s) => s.logout);
  const { confirm } = useConfirm();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const showCollapsed = isDrawer ? false : collapsed;
  const accountName = business?.name ?? user?.name ?? "Account";
  const accountEmail = user?.email ?? "";
  const avatarSrc = user?.profile_image ?? AppImages.staticUser;

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Log Out",
      message: "Are you sure you want to log out?",
      confirmLabel: "Log Out",
      danger: true,
    });
    if (!ok) return;
    onNavigate?.();
    showLoading("Logging out...");
    try {
      await logoutUser();
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      hideLoading();
    }
    logout();
    useSessionProfileStore.getState().clearSessionProfile();
    router.replace(RouteName.welcome);
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-full min-h-0 bg-white border-r shrink-0",
        isDrawer
          ? "w-full"
          : clsx("transition-all duration-300", showCollapsed ? "w-[72px]" : "w-[260px]")
      )}
      style={{ borderColor: AppColors.lightGrey }}
    >
      {/* Header */}
      <div
        className={clsx(
          "flex items-center h-14 sm:h-16 border-b shrink-0 min-h-[56px]",
          showCollapsed ? "justify-center px-2" : "px-4 sm:px-5 gap-3"
        )}
        style={{ borderColor: AppColors.lightGrey }}
      >
        <AppAsset src={AppImages.logo} width={32} height={32} className="rounded-md shrink-0" />
        {!showCollapsed && (
          <div className="min-w-0 flex-1">
            <p
              className="text-base font-bold text-black leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Xtreme-360
            </p>
            <p className="text-[11px] leading-tight" style={{ color: AppColors.grey }}>
              Business Management
            </p>
          </div>
        )}
        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <span className="material-icons text-[#646464]">close</span>
          </button>
        )}
      </div>

      {/* Scrollable navigation */}
      <nav className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2 sm:px-3">
        <NavSection
          title="Main"
          items={primaryNavItems}
          collapsed={showCollapsed}
          pathname={pathname}
          isDrawer={isDrawer}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Account"
          items={accountNavItems}
          collapsed={showCollapsed}
          pathname={pathname}
          isDrawer={isDrawer}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Modules"
          items={moduleNavItems}
          collapsed={showCollapsed}
          pathname={pathname}
          isDrawer={isDrawer}
          onNavigate={onNavigate}
        />
        <NavSection
          title="System"
          items={systemNavItems}
          collapsed={showCollapsed}
          pathname={pathname}
          isDrawer={isDrawer}
          onNavigate={onNavigate}
        />
        {/* Spacer so last items aren't clipped behind footer on small screens */}
        <div className="h-2 shrink-0" aria-hidden />
      </nav>

      {/* Footer — always visible in drawer; desktop shows logout when expanded */}
      {(isDrawer || !showCollapsed) && (
        <div
          className="shrink-0 border-t p-3 safe-area-bottom"
          style={{ borderColor: AppColors.lightGrey }}
        >
          <div className="mb-3 rounded-2xl border border-black/5 bg-[#FAFBFD] p-3">
            <div className="flex items-center gap-3 min-w-0">
              <AppAsset
                src={avatarSrc}
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-black leading-tight">{accountName}</p>
                {accountEmail && (
                  <p className="truncate text-xs leading-tight" style={{ color: AppColors.grey }}>
                    {accountEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 min-h-[44px]",
              showCollapsed && !isDrawer && "justify-center px-2"
            )}
            style={{ color: AppColors.redText, fontFamily: "var(--font-poppins)" }}
            title={showCollapsed && !isDrawer ? "Log out" : undefined}
          >
            <span className="material-icons text-lg shrink-0">logout</span>
            {(!showCollapsed || isDrawer) && <span>Log Out</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

export function DashboardHeader() {
  const router = useRouter();
  const { isWebLayout } = useResponsive();
  const { toggleCollapsed, setMobileOpen } = useSidebarStore();
  const logout = useAuthStore((s) => s.logout);
  const { confirm } = useConfirm();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const accountName = business?.name ?? user?.name ?? "Account";
  const accountEmail = user?.email ?? "";
  const avatarSrc = user?.profile_image ?? AppImages.staticUser;

  const handleMenuClick = () => {
    if (isWebLayout) toggleCollapsed();
    else setMobileOpen(true);
  };

  return (
    <header
      className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-white border-b shrink-0 z-30"
      style={{ borderColor: AppColors.lightGrey }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label={isWebLayout ? "Toggle sidebar" : "Open menu"}
          aria-expanded={!isWebLayout ? undefined : undefined}
        >
          <span className="material-icons text-[#646464]">menu</span>
        </button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
        <div
          className="hidden sm:flex items-center gap-2 sm:gap-3 pl-2 border-l"
          style={{ borderColor: AppColors.lightGrey }}
        >
          <div className="text-right hidden lg:block">
            <p className="text-sm font-semibold text-black leading-tight">{accountName}</p>
            {accountEmail && (
              <p className="text-xs truncate max-w-[180px]" style={{ color: AppColors.grey }}>
                {accountEmail}
              </p>
            )}
          </div>
          <AppAsset
            src={avatarSrc}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: "Log Out",
              message: "Are you sure you want to log out?",
              confirmLabel: "Log Out",
              danger: true,
            });
            if (!ok) return;
            showLoading("Logging out...");
            try {
              await logoutUser();
            } catch {
              // Clear local session even if the API call fails.
            } finally {
              hideLoading();
            }
            logout();
            useSessionProfileStore.getState().clearSessionProfile();
            router.replace(RouteName.welcome);
          }}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          style={{ color: AppColors.redText }}
        >
          <span className="material-icons text-base">logout</span>
          Logout
        </button>
      </div>
    </header>
  );
}
