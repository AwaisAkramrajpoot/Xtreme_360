"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  deleteAdmin,
  deleteLicense,
  fieldErrors,
  generateLicenseKeys,
  getAdmins,
  getLicenses,
  getPlatformSettings,
  getPlatformUsers,
  getSuperAdminSessions,
  revokeSuperAdminSession,
  saveAdmin,
  savePlatformSettings,
  setUserBlocked,
  superAdminLogoutAll,
  type AdminRecord,
  type LicenseRecord,
  type PlatformSettings,
  type PlatformUser,
  type SessionRecord,
} from "@/services/super-admin-api";
import { useSuperAdminAuthStore } from "@/stores/super-admin-auth-store";
import { SUPER_ADMIN_ROUTES } from "./SuperAdminShell";
import { LICENSE_STATUS, LICENSE_TYPES, LicenseModal } from "./SuperAdminLicensesScreen";
import { UserModal } from "./SuperAdminUsersScreen";
import { useAssignables, useCompanyOptions, useLoader, usePagedList } from "./use-paged-list";
import {
  Card,
  CheckboxRow,
  DataTable,
  ErrorState,
  ModalFooter,
  Pagination,
  Pill,
  SA,
  SAButton,
  SelectInput,
  TextInput,
  ToggleRow,
  formatDate,
  friendlyError,
  setDisplayPrefs,
  timeAgo,
  withoutError,
  type Column,
} from "./ui";

const TIME_ZONES = [
  "Asia/Karachi", "Asia/Dubai", "Asia/Riyadh", "Asia/Kolkata", "Asia/Dhaka", "Asia/Singapore", "Asia/Tokyo",
  "Europe/London", "Europe/Berlin", "Europe/Istanbul", "Africa/Cairo", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "Australia/Sydney", "UTC",
];
const tzLabel = (tz: string) => {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    return `(${part?.value ?? "GMT"}) ${tz.replace(/_/g, " ")}`;
  } catch {
    return tz;
  }
};

/* ---------------- settings cards ---------------- */

type Section = keyof PlatformSettings;

function SettingsCard({
  title,
  icon,
  children,
  onReset,
  onSave,
  saving,
  dirty,
  error,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  error?: string;
}) {
  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold" style={{ color: SA.text }}>
        <span aria-hidden className="material-icons text-[20px]" style={{ color: "#588157" }}>{icon}</span>
        {title}
      </h2>
      <div className="flex-1 space-y-4">{children}</div>
      {error && <p className="mt-3 text-xs text-red-500" role="alert">{error}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onReset} disabled={!dirty || saving} className="h-10 rounded-md border bg-white text-sm disabled:opacity-50" style={{ borderColor: SA.border, color: SA.text }}>
          Reset
        </button>
        <SAButton onClick={onSave} loading={saving} disabled={!dirty}>Save Changes</SAButton>
      </div>
    </Card>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="-mt-3 text-[11px]" style={{ color: SA.muted }}>{children}</p>;
}

/** Draft of one section; Save sends only that section. */
function useSectionDraft<S extends Section>(settings: PlatformSettings, section: S, onSaved: (next: PlatformSettings) => void, toast: (m: string, v?: "success" | "error") => void) {
  const [draft, setDraft] = useState<PlatformSettings[S]>(settings[section]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings[section]);
  const set = <K extends keyof PlatformSettings[S]>(key: K, value: PlatformSettings[S][K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => withoutError(e, String(key)));
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const next = await savePlatformSettings(section, draft);
      onSaved(next);
      toast("Settings saved");
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(friendlyError(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };
  const reset = () => {
    setDraft(settings[section]);
    setErrors({});
    setError("");
  };
  return { draft, set, errors, error, saving, dirty, save, reset };
}

function SettingsCards({ settings, onSaved, toast }: { settings: PlatformSettings; onSaved: (s: PlatformSettings) => void; toast: (m: string, v?: "success" | "error") => void }) {
  const general = useSectionDraft(settings, "general", onSaved, toast);
  const auth = useSectionDraft(settings, "auth", onSaved, toast);
  const license = useSectionDraft(settings, "license", onSaved, toast);
  const notifications = useSectionDraft(settings, "notifications", onSaved, toast);
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <SettingsCard title="General Settings" icon="history" onReset={general.reset} onSave={() => void general.save()} saving={general.saving} dirty={general.dirty} error={general.error}>
          <TextInput label="System Name" value={general.draft.system_name} onChange={(v) => general.set("system_name", v)} error={general.errors.system_name} />
          <TextInput label="Support Email" type="email" value={general.draft.support_email} onChange={(v) => general.set("support_email", v)} placeholder="admin@xtreme-system.com" error={general.errors.support_email} />
          <Hint>Shown to users whose account or license is suspended.</Hint>
          <SelectInput label="Time Zone" value={general.draft.time_zone} onChange={(v) => general.set("time_zone", v)}
            options={(TIME_ZONES.includes(general.draft.time_zone) ? TIME_ZONES : [general.draft.time_zone, ...TIME_ZONES]).map((tz) => ({ value: tz, label: tzLabel(tz) }))} error={general.errors.time_zone} />
          <SelectInput label="Date Format" value={general.draft.date_format} onChange={(v) => general.set("date_format", v as PlatformSettings["general"]["date_format"])}
            options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => ({ value: f, label: f }))} />
        </SettingsCard>

        <SettingsCard title="Authentication Settings" icon="history" onReset={auth.reset} onSave={() => void auth.save()} saving={auth.saving} dirty={auth.dirty} error={auth.error}>
          <SelectInput label="Login Method" value={auth.draft.login_method} onChange={() => undefined} options={[{ value: "email_password", label: "Email & Password" }]} />
          <Hint>Choose how users sign in to the system.</Hint>
          <TextInput label="Account Lockout Threshold" type="number" value={String(auth.draft.lockout_threshold)} onChange={(v) => auth.set("lockout_threshold", num(v))} error={auth.errors.lockout_threshold} />
          <Hint>Failed sign-in attempts before an account is locked for 15 minutes (3–20).</Hint>
          <TextInput label="Session Timeout (minutes)" type="number" value={String(auth.draft.session_timeout_minutes)} onChange={(v) => auth.set("session_timeout_minutes", num(v))} error={auth.errors.session_timeout_minutes} />
          <Hint>Super Admin sessions end after this long without activity (5–1440).</Hint>
        </SettingsCard>

        <SettingsCard title="License Management" icon="history" onReset={license.reset} onSave={() => void license.save()} saving={license.saving} dirty={license.dirty} error={license.error}>
          <TextInput label="License Duration (months)" type="number" value={String(license.draft.duration_months)} onChange={(v) => license.set("duration_months", num(v))} error={license.errors.duration_months} />
          <Hint>Default validity for new and renewed licenses.</Hint>
          <TextInput label="Grace Period (days)" type="number" value={String(license.draft.grace_period_days)} onChange={(v) => license.set("grace_period_days", num(v))} error={license.errors.grace_period_days} />
          <Hint>Extra days after expiry before access is blocked.</Hint>
          <TextInput label="Expiry Warning (days)" type="number" value={String(license.draft.expiry_warning_days)} onChange={(v) => license.set("expiry_warning_days", num(v))} error={license.errors.expiry_warning_days} />
          <Hint>Licenses inside this window show as “Expiring Soon”.</Hint>
          <ToggleRow label="Auto-Deactivation After Expiry" hint="Block companies whose licenses have all lapsed (after the grace period)" value={license.draft.auto_deactivate} onChange={(v) => license.set("auto_deactivate", v)} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium" style={{ color: SA.text }}>Renewal Rules</legend>
            {[
              { value: "manual" as const, label: "Manual by support verification" },
              { value: "automatic" as const, label: "Automatic renewal when a linked payment is verified" },
            ].map((o) => (
              <label key={o.value} className="mb-1 flex cursor-pointer items-center gap-2 text-sm" style={{ color: SA.text }}>
                <input type="radio" name="renewal_rule" checked={license.draft.renewal_rule === o.value} onChange={() => license.set("renewal_rule", o.value)} style={{ accentColor: "#588157" }} />
                {o.label}
              </label>
            ))}
          </fieldset>
        </SettingsCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <SettingsCard title="Notification Settings" icon="history" onReset={notifications.reset} onSave={() => void notifications.save()} saving={notifications.saving} dirty={notifications.dirty} error={notifications.error}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckboxRow label="Email Notifications" checked={notifications.draft.email} onChange={(v) => notifications.set("email", v)} />
            <CheckboxRow label="License Expiry Alerts" checked={notifications.draft.license_expiry} onChange={(v) => notifications.set("license_expiry", v)} />
            <CheckboxRow label="Payment Reminders" checked={notifications.draft.payment_reminders} onChange={(v) => notifications.set("payment_reminders", v)} />
            <CheckboxRow label="Security Alerts" checked={notifications.draft.security_alerts} onChange={(v) => notifications.set("security_alerts", v)} />
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: SA.muted }}>
            Email Notifications turns all emails on or off. Expiry alerts: a daily digest to admins. Payment reminders: the company is emailed once when its
            license enters the warning window. Security alerts: admins are emailed when an account gets locked.
          </p>
        </SettingsCard>
      </div>
    </>
  );
}

/* ---------------- admins ---------------- */

function AdminModal({ admin, onClose, onSaved }: { admin: AdminRecord | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [form, setForm] = useState({ name: admin?.name ?? "", email: admin?.email ?? "", phone: admin?.phone ?? "", password: "", active: admin?.is_active ?? true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => withoutError(e, key));
  };
  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!admin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if ((!admin || form.password) && form.password.length < 12) next.password = "At least 12 characters";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await saveAdmin(admin?.id ?? null, admin
        ? { name: form.name.trim(), phone: form.phone.trim(), is_active: form.active, ...(form.password ? { password: form.password } : {}) }
        : { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      onSaved(admin ? "Admin updated" : "Admin created");
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save admin"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppModal open onClose={onClose} title={admin ? "Edit Admin" : "Add Admin"} titleIcon="admin_panel_settings" size="md"
      footer={<ModalFooter onReset={() => setForm({ name: admin?.name ?? "", email: admin?.email ?? "", phone: admin?.phone ?? "", password: "", active: admin?.is_active ?? true })} onSave={() => void save()} saving={saving} />}>
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <TextInput label="Name" value={form.name} onChange={set("name")} error={errors.name} required />
        <TextInput label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} required={!admin} readOnly={Boolean(admin)} autoComplete="off" />
        <TextInput label="Number" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 123-4567" error={errors.phone} />
        <TextInput label={admin ? "New Password" : "Password"} type="password" value={form.password} onChange={set("password")}
          placeholder={admin ? "Leave empty to keep the current password" : "At least 12 characters"} error={errors.password} required={!admin} autoComplete="new-password" />
        {admin && <ToggleRow label="Status" hint={form.active ? "Active" : "Inactive — signed out and cannot sign in"} value={form.active} onChange={(v) => set("active")(v)} />}
      </div>
    </AppModal>
  );
}

const MASK = "••••••••";

function AdminsTable({ toast }: { toast: (m: string, v?: "success" | "error") => void }) {
  const { data, error, loading, reload } = useLoader(getAdmins, "admins", "Failed to load admins");
  const [editing, setEditing] = useState<AdminRecord | null | undefined>(undefined);
  const { confirm } = useConfirm();
  const canManage = Boolean(data?.can_manage);

  const remove = async (a: AdminRecord) => {
    const ok = await confirm({ title: "Delete admin", message: `Delete ${a.name} (${a.email})? They are signed out immediately.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteAdmin(a.id);
      toast("Admin deleted");
      reload();
    } catch (err) {
      toast(friendlyError(err, "Failed to delete admin"), "error");
    }
  };

  const columns: Column<AdminRecord>[] = [
    { key: "name", header: "Name", render: (a) => <span className="font-medium">{a.name}{a.is_me && <span className="ml-1 text-[11px]" style={{ color: SA.muted }}>(you)</span>}</span> },
    { key: "email", header: "Email", render: (a) => <span className="break-all">{a.email}</span> },
    { key: "password", header: "Password", render: () => <span aria-label="Hidden" style={{ color: SA.muted }}>{MASK}</span> },
    { key: "number", header: "Number", render: (a) => a.phone || "—" },
    { key: "date", header: "Date", render: (a) => <span className="whitespace-nowrap">{formatDate(a.created_at)}</span> },
    { key: "status", header: "Status", render: (a) => (a.is_primary ? <Pill tone="success">Primary</Pill> : <Pill tone={a.is_active ? "info" : "neutral"}>{a.is_active ? "Active" : "Deactivated"}</Pill>) },
    {
      key: "actions",
      header: "Actions",
      render: (a) =>
        a.is_primary ? (
          <span className="text-[11px]" style={{ color: SA.muted }}>Managed in backend/.env</span>
        ) : canManage ? (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(a)} className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "#1E6FD955", color: "#1E6FD9" }}>Edit</button>
            <button type="button" onClick={() => void remove(a)} className="rounded px-2 py-0.5 text-[11px] text-white" style={{ backgroundColor: "#E53935" }}>Delete</button>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: SA.muted }}>—</span>
        ),
    },
  ];

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: SA.text }}>
          <span aria-hidden className="material-icons text-[20px]" style={{ color: "#588157" }}>history</span>Create Admin
        </h2>
        <SAButton icon="add" onClick={() => setEditing(null)} disabled={!canManage} title={canManage ? undefined : "Only the primary admin can add admins"}>Add Admin</SAButton>
      </div>
      {error ? <ErrorState message={error} onRetry={() => reload()} /> : <DataTable columns={columns} rows={data?.items ?? []} rowKey={(a) => a.id} loading={loading && !data} />}
      <p className="mt-3 text-[11px]" style={{ color: SA.muted }}>Passwords are stored hashed and are never shown. Only the primary admin can add, edit or delete admins.</p>
      {editing !== undefined && <AdminModal admin={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { toast(m); reload(); }} />}
    </Card>
  );
}

/* ---------------- user logins (company owners) ---------------- */

function UserLoginsTable({ toast }: { toast: (m: string, v?: "success" | "error") => void }) {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = usePagedList(getPlatformUsers, { role: "owner", page, limit: 5 }, "Failed to load user logins");
  const [editing, setEditing] = useState<PlatformUser | null | undefined>(undefined);
  const { confirm } = useConfirm();

  const toggle = async (u: PlatformUser) => {
    const block = !u.is_blocked;
    const ok = await confirm({ title: block ? "Block login" : "Unblock login", message: `${block ? "Block" : "Unblock"} ${u.email}?${block ? " The whole company is suspended." : ""}`, confirmLabel: block ? "Block" : "Unblock", danger: block });
    if (!ok) return;
    try {
      await setUserBlocked(u.id, block);
      toast(block ? "Login blocked" : "Login unblocked");
      reload();
    } catch (err) {
      toast(friendlyError(err, "Failed to update login"), "error");
    }
  };

  const columns: Column<PlatformUser>[] = [
    { key: "company", header: "Company Name", render: (u) => <span className="font-medium">{u.company_name || "—"}</span> },
    { key: "email", header: "Email", render: (u) => <span className="break-all">{u.email}</span> },
    { key: "password", header: "Password", render: () => <span style={{ color: SA.muted }}>{MASK}</span> },
    { key: "date", header: "Date", render: (u) => <span className="whitespace-nowrap">{formatDate(u.created_at)}</span> },
    { key: "status", header: "Status", render: (u) => <Pill tone={u.status === "blocked" ? "danger" : u.status === "active" ? "info" : "warning"}>{u.status === "blocked" ? "Deactivated" : u.status === "active" ? "Active" : "Unverified"}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(u)} className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "#1E6FD955", color: "#1E6FD9" }}>Edit</button>
          <button type="button" onClick={() => void toggle(u)} className="rounded px-2 py-0.5 text-[11px] text-white" style={{ backgroundColor: u.is_blocked ? "#2E7D32" : "#E53935" }}>
            {u.is_blocked ? "Activate" : "Deactivate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: SA.text }}>
          <span aria-hidden className="material-icons text-[20px]" style={{ color: "#588157" }}>history</span>Create User Logins
        </h2>
        <SAButton icon="add" onClick={() => setEditing(null)}>New Login</SAButton>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items ?? []} rowKey={(u) => u.id} loading={loading && !data} />
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
        </>
      )}
      <p className="mt-3 text-[11px]" style={{ color: SA.muted }}>Company owner logins. New logins are team members of a company branch; new companies (with their owner) are created on the Companies page.</p>
      {editing !== undefined && <UserModal user={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { toast(m); reload(); }} />}
    </Card>
  );
}

/* ---------------- license keys ---------------- */

function GenerateKeysModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const companies = useCompanyOptions();
  const [form, setForm] = useState({ company_id: "", branch_id: "", license_type: "standard", quantity: "1" });
  const { assignables } = useAssignables(form.company_id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "company_id" ? { branch_id: "" } : {}) }));
    setErrors((e) => withoutError(e, key));
  };
  const save = async () => {
    const next: Record<string, string> = {};
    const qty = Number(form.quantity);
    if (!form.company_id) next.company_id = "Select a company";
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) next.quantity = "1 to 100";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      onSaved(await generateLicenseKeys({ company_id: Number(form.company_id), branch_id: form.branch_id ? Number(form.branch_id) : null, license_type: form.license_type, quantity: qty }));
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to generate keys"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppModal open onClose={onClose} title="Generate License Keys" titleIcon="key" size="md"
      footer={<ModalFooter onReset={() => setForm({ company_id: "", branch_id: "", license_type: "standard", quantity: "1" })} onSave={() => void save()} saving={saving} saveLabel="Generate" />}>
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <SelectInput label="Company" value={form.company_id} onChange={set("company_id")} placeholder="Select company" options={companies.map((c) => ({ value: String(c.id), label: c.name }))} error={errors.company_id} required />
        <SelectInput label="Branch" value={form.branch_id} onChange={set("branch_id")} placeholder={form.company_id ? "Any branch" : "Select a company first"}
          options={assignables.branches.map((b) => ({ value: String(b.id), label: `${b.code} · ${b.name}` }))} />
        <div className="grid grid-cols-2 gap-4">
          <SelectInput label="License Type" value={form.license_type} onChange={set("license_type")} options={LICENSE_TYPES} />
          <TextInput label="Quantity" type="number" value={form.quantity} onChange={set("quantity")} error={errors.quantity} />
        </div>
        <p className="text-xs" style={{ color: SA.muted }}>Keys start as Available. Assign one to a user or device from License Management (or Edit here) to start its term.</p>
      </div>
    </AppModal>
  );
}

function LicenseKeysTable({ toast }: { toast: (m: string, v?: "success" | "error") => void }) {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = usePagedList(getLicenses, { page, limit: 5 }, "Failed to load license keys");
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<LicenseRecord | null>(null);
  const { confirm } = useConfirm();
  const companies = useCompanyOptions();

  const remove = async (l: LicenseRecord) => {
    const ok = await confirm({ title: "Delete license key", message: `Delete ${l.license_key}?${l.status !== "available" ? " It is assigned — the holder loses this license." : ""}`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteLicense(l.id);
      toast("License key deleted");
      reload();
    } catch (err) {
      toast(friendlyError(err, "Failed to delete key"), "error");
    }
  };

  const columns: Column<LicenseRecord>[] = [
    { key: "company", header: "Company", render: (l) => <span className="font-medium">{l.company_name}</span> },
    { key: "branch", header: "Branch", render: (l) => l.branch_name || "—" },
    { key: "key", header: "License Key", render: (l) => <span className="whitespace-nowrap font-mono text-[12px]">{l.license_key}</span> },
    { key: "generated", header: "Generated On", render: (l) => <span className="whitespace-nowrap">{formatDate(l.created_at)}</span> },
    { key: "status", header: "Status", render: (l) => <Pill tone={LICENSE_STATUS[l.status].tone}>{LICENSE_STATUS[l.status].label}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (l) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(l)} className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "#1E6FD955", color: "#1E6FD9" }}>Edit</button>
          <button type="button" onClick={() => void remove(l)} className="rounded px-2 py-0.5 text-[11px] text-white" style={{ backgroundColor: "#E53935" }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: SA.text }}>
          <span aria-hidden className="material-icons text-[20px]" style={{ color: "#588157" }}>history</span>License Keys Management
        </h2>
        <SAButton icon="add" onClick={() => setGenerating(true)} disabled={!companies.length}>Generate Keys</SAButton>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : data && data.total === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: SA.muted }}>No license keys yet.</p>
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items ?? []} rowKey={(l) => l.id} loading={loading && !data} />
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
        </>
      )}
      {generating && <GenerateKeysModal onClose={() => setGenerating(false)} onSaved={(m) => { toast(m); reload(); }} />}
      {editing && <LicenseModal license={editing} onClose={() => setEditing(null)} onSaved={(m) => { toast(m); reload(); }} />}
    </Card>
  );
}

/* ---------------- account & sessions ---------------- */

function deviceLabel(agent: string | null) {
  if (!agent) return "Unknown device";
  const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser";
  const os = /Windows/.test(agent) ? "Windows" : /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Mac OS/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

function AccountSessions({ toast }: { toast: (m: string, v?: "success" | "error") => void }) {
  const router = useRouter();
  const admin = useSuperAdminAuthStore((s) => s.admin);
  const clear = useSuperAdminAuthStore((s) => s.clear);
  const { data: sessions, error, reload } = useLoader(getSuperAdminSessions, "sessions", "Failed to load sessions");
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const revoke = async (s: SessionRecord) => {
    setBusy(s.id);
    try {
      await revokeSuperAdminSession(s.id);
      toast("Session signed out");
      reload();
    } catch (err) {
      toast(friendlyError(err, "Failed to sign out session"), "error");
    } finally {
      setBusy(null);
    }
  };

  const signOutEverywhere = async () => {
    const ok = await confirm({ title: "Sign out everywhere", message: "End every session of your admin account, including this one?", confirmLabel: "Sign out", danger: true });
    if (!ok) return;
    setBusy("all");
    try {
      await superAdminLogoutAll();
    } catch {
      /* the local session ends either way */
    }
    clear("You were signed out of every session.");
    router.replace(SUPER_ADMIN_ROUTES.login);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>Your Account &amp; Sessions</h2>
          <p className="text-xs" style={{ color: SA.muted }}>{admin?.name} · {admin?.email}</p>
        </div>
        <SAButton variant="danger" icon="logout" onClick={() => void signOutEverywhere()} loading={busy === "all"}>Sign out everywhere</SAButton>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : (
        <ul className="mt-3 divide-y" style={{ borderColor: SA.border }}>
          {!sessions && Array.from({ length: 2 }, (_, i) => <li key={i} className="my-2 h-12 animate-pulse rounded bg-gray-50" />)}
          {sessions?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden className="material-icons" style={{ color: SA.muted }}>devices</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium" style={{ color: SA.text }}>
                    {deviceLabel(s.user_agent)} {s.current && <Pill tone="success">This device</Pill>}
                  </p>
                  <p className="text-xs" style={{ color: SA.muted }}>{s.ip || "Unknown IP"} · signed in {timeAgo(s.created_at)} · ends {formatDate(s.expires_at)}</p>
                </div>
              </div>
              {!s.current && <SAButton variant="outline" onClick={() => void revoke(s)} loading={busy === s.id} className="h-8 text-xs">Sign out</SAButton>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: "#F1F2F5", color: "#5B6170" }}>
        The primary Super Admin email and password are set in <code>backend/.env</code> (<code>SUPER_ADMIN_EMAIL</code>, <code>SUPER_ADMIN_PASSWORD</code>). Change them there and restart the backend.
      </p>
    </Card>
  );
}

/* ---------------- page ---------------- */

export function SuperAdminSettingsScreen() {
  const { data, error, reload } = useLoader(getPlatformSettings, "platform-settings", "Failed to load settings");
  const [saved, setSaved] = useState<PlatformSettings | null>(null);
  const settings = saved ?? data;
  const { showToast, Toast } = useToast();

  const onSaved = (next: PlatformSettings) => {
    setSaved(next);
    setDisplayPrefs({ dateFormat: next.general.date_format, timeZone: next.general.time_zone });
  };

  return (
    <>
      <h1 className="sr-only">Settings</h1>
      {error && !settings ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : !settings ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-white" />)}</div>
      ) : (
        <SettingsCards settings={settings} onSaved={onSaved} toast={showToast} />
      )}
      <div className="mt-4 space-y-4">
        <AdminsTable toast={showToast} />
        <UserLoginsTable toast={showToast} />
        <LicenseKeysTable toast={showToast} />
        <AccountSessions toast={showToast} />
      </div>
      {Toast}
    </>
  );
}
