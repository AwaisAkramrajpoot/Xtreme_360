import axios from "axios";
import { AppConfig } from "@/constants/config";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";
import { useSuperAdminAuthStore, type SuperAdminProfile } from "@/stores/super-admin-auth-store";

/**
 * Client for /api/super-admin. Separate from `apiClient`: it sends only the Super Admin token,
 * and a 401 here ends only the Super Admin session (never the normal user's).
 */
export const superAdminClient = axios.create({ baseURL: `${AppConfig.apiUrl}/super-admin` });

superAdminClient.interceptors.request.use((config) => {
  const token = useSuperAdminAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

superAdminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || "");
    if (status === 401 && !url.includes("/auth/login") && useSuperAdminAuthStore.getState().token) {
      const message = error?.response?.data?.message;
      useSuperAdminAuthStore.getState().clear(typeof message === "string" ? message : "Please sign in again.");
    }
    return Promise.reject(error);
  }
);

/* ---------------- types ---------------- */

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary?: Record<string, number>;
};

export type DashboardData = {
  totals: {
    companies: number;
    active_companies: number;
    blocked_companies: number;
    users: number;
    pending_verifications: number;
    /** Self-registered accounts awaiting approval. */
    pending_approvals: number;
    branches: number;
    companies_this_month: number;
    companies_last_month: number;
    users_this_month: number;
    users_last_month: number;
    companies_this_quarter: number;
    companies_this_year: number;
    active_licenses: number;
    licenses_this_month: number;
    licenses_last_month: number;
    pending_payments: number;
    urgent_payments: number;
    open_tickets: number;
    revenue_month: number;
    revenue_quarter: number;
    revenue_year: number;
    revenue_pending: number;
  };
  expiring_licenses: { id: number; license_key: string; license_type: string; expires_at: string; days_left: number; company_name: string }[];
  pending_payments: { id: number; payment_code: string; amount: string; created_at: string; company_name: string; license_type: string | null }[];
  recent_companies: { id: number; name: string; created_at: string; is_blocked: boolean }[];
  pending_users: { id: number; name: string; email: string; role: string; created_at: string; company_name: string | null }[];
  activity: { type: string; title: string; detail: string; at: string }[];
};

export type CompanyRecord = {
  id: number;
  name: string;
  email: string;
  type: string;
  category: string;
  person_name: string;
  address: string;
  description: string;
  mobile_number: string;
  website: string | null;
  business_logo: string | null;
  created_at: string;
  owner_user_id: string;
  owner_name: string;
  owner_email: string;
  owner_verified: boolean;
  is_blocked: boolean;
  team_count: number;
  branch_count: number;
};

export type BranchRecord = {
  id: number;
  business_id: number;
  company_name: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  status: "active" | "inactive";
  logo: string | null;
  created_at: string;
};

export type PlatformUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "owner" | "manager" | "staff";
  is_verified: boolean;
  is_active: boolean;
  is_blocked: boolean;
  company_blocked: boolean;
  status: "active" | "inactive" | "blocked" | "unverified" | "pending" | "rejected";
  /** Super Admin approval of self-registered accounts. */
  approval_status: "pending" | "approved" | "rejected";
  approval_reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  company_id: number | null;
  company_name: string | null;
  branch_id: number | null;
  branch_code: string | null;
  branch_name: string | null;
  last_seen_at: string | null;
  sms_alerts: boolean;
  password_expiry_days: number | null;
  password_expired: boolean;
  is_locked: boolean;
};

export type UserOverview = {
  recent_users: {
    id: number;
    name: string;
    email: string;
    role: string;
    last_seen_at: string | null;
    created_at: string;
    status: PlatformUser["status"];
    company_name: string | null;
    tickets: number;
  }[];
  activity: { type: string; title: string; detail: string; at: string }[];
};

export type DeviceRecord = {
  id: number;
  business_id: number;
  branch_id: number | null;
  name: string;
  device_type: string;
  serial_number: string | null;
  status: "active" | "inactive";
  company_name: string;
  branch_name: string | null;
  branch_code: string | null;
  license_key: string | null;
  created_at: string;
};

export type LicenseStatus = "active" | "expiring" | "expired" | "revoked" | "available";

export type LicenseRecord = {
  id: number;
  license_key: string;
  business_id: number;
  branch_id: number | null;
  device_id: number | null;
  user_id: number | null;
  license_type: "basic" | "standard" | "premium" | "enterprise";
  assigned_at: string | null;
  expires_at: string | null;
  created_at: string;
  company_name: string;
  branch_name: string | null;
  branch_code: string | null;
  device_name: string | null;
  user_name: string | null;
  user_email: string | null;
  days_left: number | null;
  status: LicenseStatus;
};

export type Assignables = {
  branches: { id: number; code: string; name: string }[];
  devices: { id: number; name: string; device_type: string; branch_id: number | null }[];
  users: { id: number; name: string; email: string; role: string; branch_id: number | null }[];
};

export type PaymentRecord = {
  id: number;
  payment_code: string;
  business_id: number;
  branch_id: number | null;
  license_id: number | null;
  amount: string;
  payment_date: string;
  status: "pending" | "verified" | "rejected";
  remarks: string | null;
  has_attachment: boolean;
  attachment_name: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  created_at: string;
  company_name: string;
  branch_name: string | null;
  license_key: string | null;
};

export type TicketRecord = {
  id: number;
  ticket_code: string;
  business_id: number | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  company_name: string | null;
};

export type PlatformSettings = {
  general: { system_name: string; support_email: string; time_zone: string; date_format: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" };
  auth: { login_method: "email_password"; lockout_threshold: number; session_timeout_minutes: number };
  license: {
    duration_months: number;
    grace_period_days: number;
    expiry_warning_days: number;
    auto_deactivate: boolean;
    renewal_rule: "manual" | "automatic";
  };
  notifications: { email: boolean; license_expiry: boolean; payment_reminders: boolean; security_alerts: boolean };
};

export type AdminRecord = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  is_primary: boolean;
  is_active: boolean;
  is_me: boolean;
  last_login_at: string | null;
  created_at: string;
  active_sessions: number;
};

export type ReportOverview = {
  range: "7d" | "30d" | "6m" | "12m";
  series: { period: string; revenue: number }[];
  totals: { companies: number; active_users: number; monthly_revenue: number; pending_support: number };
  distribution: { label: string; value: number }[];
};

export type SessionRecord = {
  id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  current: boolean;
};

export type ListQuery = Record<string, string | number | undefined | null>;

const clean = (query: ListQuery) =>
  Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/* ---------------- auth ---------------- */

export async function superAdminLogin(email: string, password: string) {
  const response = await superAdminClient.post<
    ApiEnvelope<{ access_token: string; expires_in: number; admin: SuperAdminProfile }>
  >("/auth/login", { email: email.trim(), password });
  return unwrap(response);
}

export async function getSuperAdminMe() {
  const response = await superAdminClient.get<ApiEnvelope<{ admin: SuperAdminProfile }>>("/auth/me");
  return unwrap(response).admin;
}

export async function superAdminLogout() {
  await superAdminClient.post("/auth/logout");
}

export async function superAdminLogoutAll() {
  await superAdminClient.post("/auth/logout-all");
}

export async function getSuperAdminSessions() {
  return unwrap(await superAdminClient.get<ApiEnvelope<SessionRecord[]>>("/auth/sessions")) ?? [];
}

export async function revokeSuperAdminSession(id: string) {
  await superAdminClient.delete(`/auth/sessions/${id}`);
}

/* ---------------- data ---------------- */

export async function getSuperAdminDashboard() {
  return unwrap(await superAdminClient.get<ApiEnvelope<DashboardData>>("/dashboard"));
}

export async function getCompanies(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<CompanyRecord>>>("/companies", { params: clean(query) }));
}

export async function getCompanyOptions() {
  return unwrap(await superAdminClient.get<ApiEnvelope<{ id: number; name: string }[]>>("/companies/options")) ?? [];
}

export async function saveCompany(id: number | null, form: FormData) {
  const response = id
    ? await superAdminClient.patch<ApiEnvelope<CompanyRecord>>(`/companies/${id}`, form)
    : await superAdminClient.post<ApiEnvelope<CompanyRecord>>("/companies", form);
  return { data: unwrap(response), message: response.data.message };
}

export async function setCompanyBlocked(id: number, blocked: boolean) {
  return unwrap(await superAdminClient.patch<ApiEnvelope<CompanyRecord>>(`/companies/${id}/status`, { blocked }));
}

export async function deleteCompany(id: number) {
  const response = await superAdminClient.delete<ApiEnvelope<{ removedAccount: boolean }>>(`/companies/${id}`);
  return response.data.message;
}

export async function getBranches(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<BranchRecord>>>("/branches", { params: clean(query) }));
}

export async function saveBranch(id: number | null, form: FormData) {
  const response = id
    ? await superAdminClient.patch<ApiEnvelope<BranchRecord>>(`/branches/${id}`, form)
    : await superAdminClient.post<ApiEnvelope<BranchRecord>>("/branches", form);
  return unwrap(response);
}

export async function deleteBranch(id: number) {
  await superAdminClient.delete(`/branches/${id}`);
}

export async function getPlatformUsers(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<PlatformUser>>>("/users", { params: clean(query) }));
}

export async function setUserBlocked(id: number, blocked: boolean) {
  await superAdminClient.patch(`/users/${id}/status`, { blocked });
}

export async function verifyPlatformUser(id: number) {
  await superAdminClient.patch(`/users/${id}/verify`);
}

/** Approve or reject a self-registered account. Returns the server's confirmation message. */
export async function reviewPlatformUser(id: number, action: "approve" | "reject", reason?: string) {
  const response = await superAdminClient.patch<ApiEnvelope<{ id: number; approval_status: string }>>(`/users/${id}/approval`, {
    action,
    ...(reason ? { reason } : {}),
  });
  return response.data.message;
}

/** Field errors from a 400 response ({ data: { errors } }), if any. */
export function fieldErrors(error: unknown): Record<string, string> {
  const errors = (error as { response?: { data?: { data?: { errors?: Record<string, string> } } } })?.response?.data
    ?.data?.errors;
  return errors && typeof errors === "object" ? errors : {};
}

/* ---------------- users (create / edit / delete) ---------------- */

export type UserPayload = {
  branch_id?: number | null;
  name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  user_type?: "administrator" | "standard" | "owner";
  is_active?: boolean;
  sms_alerts?: boolean;
  password_expiry_days?: number | null;
  unlock?: boolean;
};

export async function getUserOverview() {
  return unwrap(await superAdminClient.get<ApiEnvelope<UserOverview>>("/users/overview"));
}

export async function createPlatformUser(payload: UserPayload) {
  return unwrap(await superAdminClient.post<ApiEnvelope<{ id: number }>>("/users", payload));
}

export async function updatePlatformUser(id: number, payload: UserPayload) {
  return unwrap(await superAdminClient.patch<ApiEnvelope<{ id: number }>>(`/users/${id}`, payload));
}

export async function deletePlatformUser(id: number) {
  await superAdminClient.delete(`/users/${id}`);
}

/* ---------------- devices & licenses ---------------- */

export async function getDevices(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<DeviceRecord>>>("/devices", { params: clean(query) }));
}

export async function saveDevice(id: number | null, payload: Record<string, unknown>) {
  const response = id
    ? await superAdminClient.patch<ApiEnvelope<DeviceRecord>>(`/devices/${id}`, payload)
    : await superAdminClient.post<ApiEnvelope<DeviceRecord>>("/devices", payload);
  return unwrap(response);
}

export async function deleteDevice(id: number) {
  await superAdminClient.delete(`/devices/${id}`);
}

export async function getLicenses(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<LicenseRecord>>>("/licenses", { params: clean(query) }));
}

export async function getAssignables(companyId: number) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Assignables>>(`/companies/${companyId}/assignables`));
}

export async function assignLicense(payload: Record<string, unknown>) {
  return unwrap(await superAdminClient.post<ApiEnvelope<LicenseRecord>>("/licenses", payload));
}

export async function updateLicense(id: number, payload: Record<string, unknown>) {
  return unwrap(await superAdminClient.patch<ApiEnvelope<LicenseRecord>>(`/licenses/${id}`, payload));
}

export async function generateLicenseKeys(payload: Record<string, unknown>) {
  const response = await superAdminClient.post<ApiEnvelope<{ ids: number[] }>>("/licenses/generate", payload);
  return response.data.message;
}

export async function renewLicense(id: number) {
  const response = await superAdminClient.post<ApiEnvelope<LicenseRecord>>(`/licenses/${id}/renew`);
  return response.data.message;
}

export async function expireLicense(id: number) {
  await superAdminClient.post(`/licenses/${id}/expire`);
}

export async function deleteLicense(id: number) {
  await superAdminClient.delete(`/licenses/${id}`);
}

/* ---------------- payments ---------------- */

export async function getPayments(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<PaymentRecord>>>("/payments", { params: clean(query) }));
}

export async function savePayment(id: number | null, form: FormData) {
  const response = id
    ? await superAdminClient.patch<ApiEnvelope<PaymentRecord>>(`/payments/${id}`, form)
    : await superAdminClient.post<ApiEnvelope<PaymentRecord>>("/payments", form);
  return unwrap(response);
}

export async function reviewPayment(id: number, status: PaymentRecord["status"]) {
  const response = await superAdminClient.post<ApiEnvelope<PaymentRecord>>(`/payments/${id}/review`, { status });
  return response.data.message;
}

export async function deletePayment(id: number) {
  await superAdminClient.delete(`/payments/${id}`);
}

/** Receipts are private: fetched with the Super Admin token, then opened from a blob URL. */
export async function openPaymentAttachment(id: number) {
  const response = await superAdminClient.get<Blob>(`/payments/${id}/attachment`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  // A same-origin blob URL; "noopener" would make window.open return null, so it is not used.
  const tab = window.open(url, "_blank");
  if (!tab) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ---------------- support ---------------- */

export async function getTickets(query: ListQuery) {
  return unwrap(await superAdminClient.get<ApiEnvelope<Paged<TicketRecord>>>("/support-tickets", { params: clean(query) }));
}

export async function updateTicket(id: number, payload: Partial<Pick<TicketRecord, "status" | "priority" | "admin_response">>) {
  return unwrap(await superAdminClient.patch<ApiEnvelope<TicketRecord>>(`/support-tickets/${id}`, payload));
}

/* ---------------- reports ---------------- */

export async function getReportOverview(range: string, distribution: string) {
  return unwrap(await superAdminClient.get<ApiEnvelope<ReportOverview>>("/reports/overview", { params: { range, distribution } }));
}

export async function getReportActivity(range: string) {
  return unwrap(
    await superAdminClient.get<ApiEnvelope<{ range: string; items: { type: string; title: string; detail: string; at: string }[] }>>(
      "/reports/activity",
      { params: { range } }
    )
  );
}

/* ---------------- settings & admins ---------------- */

export async function getPlatformSettings() {
  return unwrap(await superAdminClient.get<ApiEnvelope<PlatformSettings>>("/settings"));
}

export async function savePlatformSettings<K extends keyof PlatformSettings>(section: K, patch: Partial<PlatformSettings[K]>) {
  return unwrap(await superAdminClient.patch<ApiEnvelope<PlatformSettings>>(`/settings/${section}`, patch));
}

export async function getAdmins() {
  return unwrap(await superAdminClient.get<ApiEnvelope<{ items: AdminRecord[]; can_manage: boolean }>>("/admins"));
}

export async function saveAdmin(id: number | null, payload: Record<string, unknown>) {
  const response = id
    ? await superAdminClient.patch<ApiEnvelope<AdminRecord>>(`/admins/${id}`, payload)
    : await superAdminClient.post<ApiEnvelope<AdminRecord>>("/admins", payload);
  return unwrap(response);
}

export async function deleteAdmin(id: number) {
  await superAdminClient.delete(`/admins/${id}`);
}
