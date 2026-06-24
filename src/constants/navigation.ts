import { AppImages } from "./images";
import { RouteName } from "./routes";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  section?: "primary" | "account" | "modules" | "system";
}

export const primaryNavItems: NavItem[] = [
  { label: "Dashboard", href: RouteName.bottomBar, icon: AppImages.home, section: "primary" },
  { label: "Profile", href: "/profile", icon: AppImages.profile, section: "primary" },
  { label: "Quick Menu", href: "/quick-menu", icon: AppImages.quickMenu, section: "primary" },
  { label: "Reports", href: "/reports", icon: AppImages.reports, section: "primary" },
  { label: "Main Menu", href: "/main-menu", icon: AppImages.mainMenu, section: "primary" },
];

export const accountNavItems: NavItem[] = [
  { label: "Business Detail", href: RouteName.businessDetail, icon: AppImages.businessDetail, section: "account" },
  { label: "User Management", href: RouteName.userManagement, icon: AppImages.userManagement, section: "account" },
];

export const moduleNavItems: NavItem[] = [
  { label: "Party", href: RouteName.party, icon: AppImages.party, section: "modules" },
  { label: "Sales", href: RouteName.sales, icon: AppImages.sales, section: "modules" },
  { label: "Purchase", href: RouteName.purchase, icon: AppImages.purchase, section: "modules" },
  { label: "Items", href: RouteName.itemManagement, icon: AppImages.item, section: "modules" },
  { label: "Expense", href: RouteName.expense, icon: AppImages.expense, section: "modules" },
  { label: "Cash & Bank", href: RouteName.cashBank, icon: AppImages.cashBank, section: "modules" },
  { label: "Employee", href: RouteName.employee, icon: AppImages.employee, section: "modules" },
  { label: "Other Income", href: RouteName.otherIncome, icon: AppImages.otherIncome, section: "modules" },
  { label: "Calendar", href: RouteName.calendar, icon: AppImages.calendar, section: "modules" },
  { label: "POS", href: RouteName.posList, icon: AppImages.item, section: "modules" },
];

export const systemNavItems: NavItem[] = [
  { label: "Utilities", href: RouteName.utilities, icon: AppImages.utilities, section: "system" },
  { label: "Marketing", href: RouteName.marketing, icon: AppImages.marketing, section: "system" },
  { label: "Backup & Restore", href: RouteName.backUpAndRestore, icon: AppImages.backupRestore, section: "system" },
  { label: "Settings", href: RouteName.settings, icon: AppImages.setting, section: "system" },
  { label: "Plans & Pricing", href: RouteName.plansAndPricing, icon: AppImages.plansPricing, section: "system" },
];

export const allSidebarNavItems = [
  ...primaryNavItems,
  ...accountNavItems,
  ...moduleNavItems,
  ...systemNavItems,
];

export const AUTH_ROUTES = [
  RouteName.login,
  RouteName.register,
  RouteName.verifyEmail,
  RouteName.verifyOtp,
  RouteName.newPassword,
  RouteName.businessRegisteration,
] as const;

export const INTRO_ROUTES = [
  RouteName.splash,
  RouteName.welcome,
  RouteName.onBoarding,
  RouteName.languageSelection,
] as const;

export function isDashboardRoute(route: string): boolean {
  if (AUTH_ROUTES.includes(route as (typeof AUTH_ROUTES)[number])) return false;
  if (INTRO_ROUTES.includes(route as (typeof INTRO_ROUTES)[number])) return false;
  return true;
}

export function isAuthRoute(route: string): boolean {
  return AUTH_ROUTES.includes(route as (typeof AUTH_ROUTES)[number]);
}

/** Bottom nav tab index → route (matches bottomBarItems order). */
export const bottomNavRoutes = [
  RouteName.bottomBar,
  "/profile",
  "/quick-menu",
  "/reports",
  "/main-menu",
] as const;
