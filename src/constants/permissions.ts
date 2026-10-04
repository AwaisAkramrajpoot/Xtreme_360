import { RouteName } from "@/constants/routes";

/**
 * Mirrors backend/utils/permissions.js for navigation: which pages each role may open.
 * The server enforces the real rules; this only hides what a role can't use.
 */
export type Role = "owner" | "manager" | "staff";

const RANK: Record<Role, number> = { staff: 1, manager: 2, owner: 3 };

/** [route prefix, minimum role]; the longest matching prefix wins; unlisted routes are open to everyone. */
const ROUTE_RULES: Array<[string, Role]> = [
  [RouteName.userManagement, "owner"],
  [RouteName.backUpAndRestore, "owner"],
  ["/reports", "manager"],
  [RouteName.purchase, "manager"],
  [RouteName.cashBank, "manager"],
  [RouteName.expense, "manager"],
  [RouteName.otherIncome, "manager"],
  [RouteName.employee, "manager"],
  [RouteName.settings, "manager"],
  [RouteName.utilities, "manager"],
  [RouteName.helpSupport, "staff"], // anyone may contact support
  [RouteName.addProduct, "manager"],
  [RouteName.addService, "manager"],
  [RouteName.addCategory, "manager"],
  [RouteName.addUnit, "manager"],
  [RouteName.addManufacturing, "manager"],
  [RouteName.setConversion, "manager"],
].sort((a, b) => b[0].length - a[0].length) as Array<[string, Role]>;

export function normalizeRole(role?: string | null): Role {
  return role === "manager" || role === "staff" ? role : "owner";
}

export function hasRole(role: Role, minimum: Role) {
  return RANK[role] >= RANK[minimum];
}

export function requiredRoleFor(href: string): Role {
  const rule = ROUTE_RULES.find(([prefix]) => href === prefix || href.startsWith(`${prefix}/`));
  return rule ? rule[1] : "staff";
}

export function canAccessRoute(href: string | undefined, role: Role) {
  return !href || hasRole(role, requiredRoleFor(href));
}

export const ROLE_LABELS: Record<Role, string> = { owner: "Owner", manager: "Manager", staff: "Staff" };

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full access, including team, backups and closing financial years.",
  manager: "Sales, purchases, accounts, expenses, items, reports and settings. No team or backup tools.",
  staff: "Sales documents, POS, parties and calendar. Cannot delete or see purchases, accounts or reports.",
};
