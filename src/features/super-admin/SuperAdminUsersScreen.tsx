"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  createPlatformUser,
  deletePlatformUser,
  fieldErrors,
  getBranches,
  getPlatformUsers,
  getUserOverview,
  reviewPlatformUser,
  setUserBlocked,
  updatePlatformUser,
  verifyPlatformUser,
  type BranchRecord,
  type PlatformUser,
  type UserPayload,
} from "@/services/super-admin-api";
import { fetchAllPages, useLoader, usePagedList } from "./use-paged-list";
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FieldLabel,
  FilterSelect,
  ModalFooter,
  PageHeader,
  Pagination,
  Pill,
  RowAction,
  SA,
  SAButton,
  SearchBox,
  SelectInput,
  StatCard,
  TextInput,
  ToggleRow,
  downloadCsv,
  formatDate,
  friendlyError,
  timeAgo,
  useDebounced,
  withoutError,
  type Column,
  type Tone,
} from "./ui";

const STATUS: Record<PlatformUser["status"], { tone: Tone; label: string }> = {
  active: { tone: "success", label: "Active" },
  pending: { tone: "warning", label: "Pending Approval" },
  rejected: { tone: "danger", label: "Rejected" },
  inactive: { tone: "neutral", label: "Inactive" },
  unverified: { tone: "info", label: "Unverified" },
  blocked: { tone: "danger", label: "Blocked" },
};
const ROLE_LABEL: Record<string, string> = { owner: "Business User", manager: "Administrator", staff: "Standard User" };

const USER_TYPES = [
  { value: "owner" as const, label: "Business User", hint: "Own account; sets up their business after signing in" },
  { value: "administrator" as const, label: "Administrator", hint: "Company team: purchases, accounts, expenses, reports" },
  { value: "standard" as const, label: "Standard User", hint: "Company team: sales, POS, parties" },
];

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";

/* ---------------- User Information form ---------------- */

type UserForm = {
  branch_id: string;
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  expiry_on: boolean;
  expiry_days: string;
  active: boolean;
  user_type: "administrator" | "standard" | "owner";
  sms: boolean;
};

const formFrom = (u: PlatformUser | null): UserForm => ({
  branch_id: u?.branch_id ? String(u.branch_id) : "",
  name: u?.name ?? "",
  email: u?.email ?? "",
  password: "",
  confirm_password: "",
  expiry_on: Boolean(u?.password_expiry_days),
  expiry_days: String(u?.password_expiry_days ?? 90),
  active: u ? u.is_active : true,
  user_type: !u || u.role === "owner" ? "owner" : u.role === "manager" ? "administrator" : "standard",
  sms: u?.sms_alerts ?? false,
});

export function UserModal({ user, onClose, onSaved }: { user: PlatformUser | null; onClose: () => void; onSaved: (m: string) => void }) {
  const isEdit = Boolean(user);
  const isOwner = user?.role === "owner";
  const { data: branchPage } = useLoader(() => getBranches({ limit: 100 }), "user-form-branches", "Failed to load branches");
  const branches: BranchRecord[] = (branchPage?.items ?? []).filter((b) => !user?.company_id || b.business_id === user.company_id);
  const [form, setForm] = useState<UserForm>(() => formFrom(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof UserForm>(key: K) => (value: UserForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => withoutError(e, key === "user_type" ? "user_type" : key));
  };
  const branch = branches.find((b) => String(b.id) === form.branch_id);
  // A new Business User has no branch; team logins (Administrator / Standard User) need one.
  const standalone = isEdit ? isOwner : form.user_type === "owner";

  const save = async () => {
    const next: Record<string, string> = {};
    if (!standalone && !form.branch_id) next.branch_id = "Select a branch";
    if (!form.name.trim()) next.name = "Username is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (!isEdit && form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (isEdit && form.password && form.password.length < 8) next.password = "Password must be at least 8 characters";
    if (form.password && form.confirm_password !== form.password) next.confirm_password = "Passwords do not match";
    const days = Number(form.expiry_days);
    if (form.expiry_on && (!Number.isInteger(days) || days < 1 || days > 365)) next.password_expiry_days = "1 to 365 days";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    const payload: UserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      is_active: form.active,
      sms_alerts: form.sms,
      password_expiry_days: form.expiry_on ? days : null,
      ...(form.branch_id && !(standalone && !isEdit) ? { branch_id: Number(form.branch_id) } : {}),
      ...(isOwner ? {} : { user_type: form.user_type }),
      ...(form.password ? { password: form.password, confirm_password: form.confirm_password } : {}),
    };
    setSaving(true);
    try {
      if (user) await updatePlatformUser(user.id, payload);
      else await createPlatformUser(payload);
      onSaved(user ? "User updated" : `User created. ${payload.email} can sign in on the login page now.`);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save user"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={isEdit ? "Edit User" : "Create User"}
      titleIcon="badge"
      size="lg"
      footer={<ModalFooter onReset={() => { setForm(formFrom(user)); setErrors({}); setSubmitError(""); }} onSave={() => void save()} saving={saving} />}
    >
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        {!isEdit && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium" style={{ color: SA.text }}>
              Account Type <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {USER_TYPES.map((o) => {
                const selected = form.user_type === o.value;
                return (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors"
                    style={{ borderColor: selected ? "#588157" : SA.border, backgroundColor: selected ? SA.accentSoft : "#fff", color: SA.text }}
                  >
                    <input type="radio" name="user_type" checked={selected} onChange={() => set("user_type")(o.value)} className="mt-1" style={{ accentColor: "#588157" }} />
                    <span>
                      <span className="font-medium">{o.label}</span>
                      <span className="block text-xs" style={{ color: SA.muted }}>{o.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.user_type && <span className="mt-1 block text-xs text-red-500">{errors.user_type}</span>}
            <p className="mt-2 text-xs" style={{ color: SA.muted }}>
              Accounts you create are approved at once. The user signs in on the normal login page with this email and password.
            </p>
          </fieldset>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!(standalone && !isEdit) && (
            <>
          <SelectInput
            label="Branch Code"
            value={form.branch_id}
            onChange={(v) => set("branch_id")(v)}
            placeholder={branches.length ? (isOwner ? "No branch" : "Select branch") : "Add a branch first"}
            options={branches.map((b) => ({ value: String(b.id), label: `${b.code} · ${b.company_name}` }))}
            error={errors.branch_id}
            required={!standalone}
          />
          <TextInput label="Branch Name" value={branch ? branch.name : ""} onChange={() => undefined} placeholder="Filled from the branch" readOnly />
            </>
          )}
          <TextInput label="Full Name" value={form.name} onChange={(v) => set("name")(v)} placeholder="Full name" error={errors.name} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(v) => set("email")(v)} placeholder="user@company.com" error={errors.email} required autoComplete="off" />
          <TextInput
            label={isEdit ? "New Password" : "Password"}
            type="password"
            value={form.password}
            onChange={(v) => set("password")(v)}
            placeholder={isEdit ? "Leave empty to keep the current password" : "At least 8 characters"}
            error={errors.password}
            required={!isEdit}
            autoComplete="new-password"
          />
          <TextInput
            label="Confirm Password"
            type="password"
            value={form.confirm_password}
            onChange={(v) => set("confirm_password")(v)}
            placeholder={isEdit ? "Repeat the new password" : "Repeat the password"}
            error={errors.confirm_password}
            required={!isEdit || Boolean(form.password)}
            autoComplete="new-password"
          />
          <div className="space-y-2">
            <FieldLabel>Expire Password</FieldLabel>
            <ToggleRow label="Enable Password Expiry" value={form.expiry_on} onChange={(v) => set("expiry_on")(v)} />
            {form.expiry_on && (
              <TextInput label="Expires after (days)" type="number" value={form.expiry_days} onChange={(v) => set("expiry_days")(v)} error={errors.password_expiry_days} />
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Status</FieldLabel>
            <ToggleRow label={form.active ? "Active" : "Inactive"} value={form.active} onChange={(v) => set("active")(v)} />
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: SA.border }}>
          <p className="mb-3 text-sm font-semibold" style={{ color: "#588157" }}>User Type &amp; Permissions</p>
          {standalone ? (
            <p className="text-sm" style={{ color: SA.muted }}>Business User — full access to their own business. This type cannot change.</p>
          ) : !isEdit ? (
            <p className="text-sm" style={{ color: SA.muted }}>
              {form.user_type === "administrator" ? "Administrator" : "Standard User"} of the selected branch&apos;s company.
            </p>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium" style={{ color: SA.text }}>User Type <span className="text-red-500">*</span></legend>
              <div className="flex flex-wrap gap-6 text-sm" style={{ color: SA.text }}>
                {[
                  { value: "administrator" as const, label: "Administrator", hint: "Manager: purchases, accounts, expenses, reports" },
                  { value: "standard" as const, label: "Standard User", hint: "Staff: sales, POS, parties" },
                ].map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-start gap-2">
                    <input type="radio" name="user_type" checked={form.user_type === o.value} onChange={() => set("user_type")(o.value)} className="mt-1" style={{ accentColor: "#588157" }} />
                    <span>
                      {o.label}
                      <span className="block text-xs" style={{ color: SA.muted }}>{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.user_type && <span className="mt-1 block text-xs text-red-500">{errors.user_type}</span>}
            </fieldset>
          )}
          <div className="mt-4">
            <FieldLabel>SMS Alerts</FieldLabel>
            <ToggleRow label="Enable SMS Alerts" hint="Saved as the user's preference" value={form.sms} onChange={(v) => set("sms")(v)} />
          </div>
        </div>
      </div>
    </AppModal>
  );
}

/* ---------------- reject ---------------- */

function RejectModal({ user, onClose, onRejected }: { user: PlatformUser; onClose: () => void; onRejected: (message: string) => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reject = async () => {
    setSaving(true);
    setError("");
    try {
      onRejected(await reviewPlatformUser(user.id, "reject", reason.trim() || undefined));
      onClose();
    } catch (err) {
      setError(friendlyError(err, "Failed to reject the account"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title="Reject Account"
      titleIcon="person_off"
      size="md"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <SAButton variant="outline" onClick={onClose} disabled={saving}>Cancel</SAButton>
          <SAButton variant="danger" icon="block" onClick={() => void reject()} loading={saving}>Reject</SAButton>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
        <p className="text-sm" style={{ color: SA.text }}>
          Reject <b>{user.name}</b> ({user.email})? They will not be able to sign in. You can still approve the account later.
        </p>
        <TextInput label="Reason (optional)" value={reason} onChange={setReason} placeholder="Shown to the user in the email, if email is set up" multiline />
      </div>
    </AppModal>
  );
}

/* ---------------- profile ---------------- */

function ProfileModal({
  user,
  onClose,
  onEdit,
  onApprove,
  onReject,
}: {
  user: PlatformUser;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const needsReview = user.approval_status !== "approved";
  const rows: [string, string][] = [
    ["Email", user.email],
    ["Phone", user.phone || "—"],
    ["User type", ROLE_LABEL[user.role] ?? user.role],
    ["Company", user.company_name || "—"],
    ["Branch", user.branch_name ? `${user.branch_code} · ${user.branch_name}` : "—"],
    ["Last active", user.last_seen_at ? timeAgo(user.last_seen_at) : "Never"],
    ["Registered", formatDate(user.created_at)],
    [
      "Approval",
      user.approval_status === "approved"
        ? user.approval_reviewed_at ? `Approved ${formatDate(user.approval_reviewed_at)}` : "Approved"
        : user.approval_status === "pending" ? "Awaiting approval" : `Rejected${user.approval_reviewed_at ? ` ${formatDate(user.approval_reviewed_at)}` : ""}`,
    ],
    ...(user.rejection_reason ? ([["Rejection reason", user.rejection_reason]] as [string, string][]) : []),
    ["Password expiry", user.password_expiry_days ? `Every ${user.password_expiry_days} days${user.password_expired ? " (expired)" : ""}` : "Never"],
    ["SMS alerts", user.sms_alerts ? "On" : "Off"],
  ];
  return (
    <AppModal open onClose={onClose} title="User Profile" titleIcon="account_circle" size="md"
      footer={
        needsReview ? (
          <div className="grid grid-cols-3 gap-2">
            <SAButton variant="outline" icon="edit" onClick={onEdit}>Edit</SAButton>
            {user.approval_status === "pending" ? (
              <SAButton variant="danger" icon="close" onClick={onReject}>Reject</SAButton>
            ) : (
              <span />
            )}
            <SAButton icon="check" onClick={onApprove}>Approve</SAButton>
          </div>
        ) : (
          <SAButton icon="edit" onClick={onEdit} className="w-full">Edit User</SAButton>
        )
      }>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white" style={{ backgroundColor: "#588157" }}>{initials(user.name)}</span>
        <div>
          <p className="font-semibold" style={{ color: SA.text }}>{user.name}</p>
          <Pill tone={STATUS[user.status].tone}>{STATUS[user.status].label}</Pill>
          {user.is_locked && <span className="ml-1"><Pill tone="danger">Locked</Pill></span>}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs" style={{ color: SA.muted }}>{k}</dt>
            <dd className="break-all" style={{ color: SA.text }}>{v}</dd>
          </div>
        ))}
      </dl>
    </AppModal>
  );
}

/* ---------------- screen ---------------- */

/** `openCreate` opens the Create User form on arrival (/super-admin/users/create). */
export function SuperAdminUsersScreen({ openCreate = false }: { openCreate?: boolean }) {
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const status = params.get("status") ?? "";
  return <UsersList key={`${search}|${status}`} initialSearch={search} initialStatus={status} openCreate={openCreate} />;
}

function UsersList({ initialSearch, initialStatus, openCreate }: { initialSearch: string; initialStatus: string; openCreate: boolean }) {
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<PlatformUser | null | undefined>(openCreate ? null : undefined);
  const [rejecting, setRejecting] = useState<PlatformUser | null>(null);
  const [viewing, setViewing] = useState<PlatformUser | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const query = { search: debouncedSearch.trim(), role, status };
  const { data, loading, error, reload } = usePagedList(getPlatformUsers, { ...query, page, limit: 10 }, "Failed to load users");
  const overview = useLoader(getUserOverview, "user-overview", "Failed to load recent users");
  const summary = data?.summary;
  const refresh = () => {
    reload();
    overview.reload();
  };

  const run = async (u: PlatformUser, action: () => Promise<unknown>, message: string) => {
    setBusyId(u.id);
    try {
      await action();
      showToast(message);
      refresh();
    } catch (err) {
      showToast(friendlyError(err, "Action failed"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const toggleBlock = async (u: PlatformUser) => {
    const block = !u.is_blocked;
    const ok = await confirm({
      title: block ? "Block user" : "Unblock user",
      message: block
        ? `Block ${u.name} (${u.email})? They are signed out and cannot use Xtreme 360 until unblocked.${u.role === "owner" ? " As the owner, their whole team is blocked too." : ""}`
        : `Unblock ${u.name}?`,
      confirmLabel: block ? "Block" : "Unblock",
      danger: block,
    });
    if (ok) await run(u, () => setUserBlocked(u.id, block), block ? "User blocked" : "User unblocked");
  };

  const approve = async (u: PlatformUser) => {
    const ok = await confirm({
      title: "Approve account",
      message: `Approve ${u.name} (${u.email})? They can sign in and use Xtreme 360 straight away.${u.is_verified ? "" : " They still need to verify their email on first sign-in."}`,
      confirmLabel: "Approve",
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      showToast(await reviewPlatformUser(u.id, "approve"));
      setViewing(null);
      refresh();
    } catch (err) {
      showToast(friendlyError(err, "Failed to approve the account"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: PlatformUser) => {
    const ok = await confirm({
      title: "Delete user",
      message: `Delete ${u.name} (${u.email})? Their login is removed${u.role === "owner" ? " permanently" : "; company data stays"}.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) await run(u, () => deletePlatformUser(u.id), "User deleted");
  };

  const openProfile = async (id: number, email: string) => {
    const hit = data?.items.find((u) => u.id === id);
    if (hit) return setViewing(hit);
    try {
      const found = (await getPlatformUsers({ search: email, limit: 5 })).items.find((u) => u.id === id);
      if (found) setViewing(found);
    } catch (err) {
      showToast(friendlyError(err, "Could not open the profile"), "error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getPlatformUsers, query);
      downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Name", "Email", "Phone", "User type", "Company", "Branch", "Status", "Last active", "Joined"],
        rows.map((u) => [u.name, u.email, u.phone, ROLE_LABEL[u.role], u.company_name, u.branch_name, STATUS[u.status].label, u.last_seen_at ? formatDate(u.last_seen_at) : "", formatDate(u.created_at)]));
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<PlatformUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div className="min-w-0">
          <p className="max-w-[170px] truncate font-medium">{u.name}</p>
          <p className="max-w-[170px] truncate text-[11px]" style={{ color: SA.muted }}>{u.email}</p>
        </div>
      ),
    },
    { key: "role", header: "User Type", render: (u) => ROLE_LABEL[u.role] ?? u.role },
    { key: "registered", header: "Registered", render: (u) => <span className="whitespace-nowrap">{formatDate(u.created_at)}</span> },
    { key: "company", header: "Company", render: (u) => <span className="line-clamp-2 max-w-[150px]">{u.company_name || "—"}</span> },
    { key: "branch", header: "Branch", render: (u) => (u.branch_code ? `${u.branch_code}` : "—") },
    { key: "active", header: "Last Active", render: (u) => <span className="whitespace-nowrap">{u.last_seen_at ? timeAgo(u.last_seen_at) : "Never"}</span> },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <div className="flex flex-col items-start gap-1">
          <Pill tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Pill>
          {u.is_locked && <Pill tone="danger">Locked</Pill>}
          {u.company_blocked && !u.is_blocked && <span className="text-[10px]" style={{ color: SA.muted }}>via company</span>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) =>
        busyId === u.id ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <div className="flex items-center gap-0.5">
            {u.approval_status !== "approved" && (
              <RowAction icon="check_circle" label={`Approve ${u.name}`} color="#2E7D32" onClick={() => void approve(u)} />
            )}
            {u.approval_status === "pending" && (
              <RowAction icon="cancel" label={`Reject ${u.name}`} color="#D14343" onClick={() => setRejecting(u)} />
            )}
            <RowAction icon="visibility" label={`View ${u.name}`} color={SA.muted} onClick={() => setViewing(u)} />
            <RowAction icon="edit_note" label={`Edit ${u.name}`} color="#1E6FD9" onClick={() => setEditing(u)} />
            {!u.is_verified && <RowAction icon="verified_user" label={`Verify ${u.name}`} color="#2E7D32" onClick={() => void run(u, () => verifyPlatformUser(u.id), `${u.name} verified`)} />}
            {u.is_locked && <RowAction icon="lock_open" label={`Unlock ${u.name}`} color="#2E7D32" onClick={() => void run(u, () => updatePlatformUser(u.id, { unlock: true }), "Account unlocked")} />}
            <RowAction icon={u.is_blocked ? "how_to_reg" : "block"} label={u.is_blocked ? `Unblock ${u.name}` : `Block ${u.name}`} color={u.is_blocked ? "#2E7D32" : "#0288D1"} onClick={() => void toggleBlock(u)} />
            {(u.role !== "owner" || !u.company_id) && <RowAction icon="delete" label={`Delete ${u.name}`} color="#E91E63" onClick={() => void remove(u)} />}
          </div>
        ),
    },
  ];

  const filtered = Boolean(query.search || role || status);

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Review sign-ups, create users and manage every account on Xtreme 360"
        actions={
          <>
            <SAButton icon="person_add" onClick={() => setEditing(null)}>Create User</SAButton>
            <SAButton variant="outline" icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>Export</SAButton>
            <SAButton variant="outline" icon="refresh" onClick={refresh}>Refresh</SAButton>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="group" label="Total User" value={summary?.total ?? 0} badge={summary ? `+${summary.this_month} this month` : undefined} loading={!summary} />
        <StatCard icon="how_to_reg" label="Active User" value={summary?.active ?? 0} badge={summary ? `${summary.online} currently online` : undefined} loading={!summary} />
        <StatCard icon="pending_actions" label="Pending Approval" value={summary?.pending ?? 0} badge={summary ? `${summary.rejected ?? 0} rejected · ${summary.unverified} unverified` : undefined} badgeTone={summary?.pending ? "danger" : "neutral"} loading={!summary} />
        <StatCard icon="gpp_maybe" label="Security Alerts" value={summary?.security_alerts ?? 0} badge={summary ? `${summary.urgent_alerts} urgent` : undefined} badgeTone={summary?.urgent_alerts ? "danger" : "neutral"} loading={!summary} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold" style={{ color: SA.text }}>Recent User</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!overview.data &&
              Array.from({ length: 4 }, (_, i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-white" />)}
            {overview.data?.recent_users.length === 0 && <p className="text-sm" style={{ color: SA.muted }}>No users yet.</p>}
            {overview.data?.recent_users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "#588157" }}>{initials(u.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold" style={{ color: SA.text }}>{u.name}</p>
                    <p className="truncate text-[11px]" style={{ color: SA.muted }}>{ROLE_LABEL[u.role] ?? u.role}{u.company_name ? ` · ${u.company_name}` : ""}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between"><dt style={{ color: SA.muted }}>Status</dt><dd><Pill tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Pill></dd></div>
                  <div className="flex items-center justify-between"><dt style={{ color: SA.muted }}>Support tickets</dt><dd style={{ color: SA.text }}>{u.tickets}</dd></div>
                  <div className="flex items-center justify-between"><dt style={{ color: SA.muted }}>Last Active</dt><dd style={{ color: SA.text }}>{u.last_seen_at ? timeAgo(u.last_seen_at) : "Never"}</dd></div>
                </dl>
                <SAButton className="mt-3 h-8 w-full text-xs" onClick={() => void openProfile(u.id, u.email)}>View Profile</SAButton>
              </Card>
            ))}
          </div>
        </div>
        <Card className="p-4">
          <h2 className="mb-3 text-[15px] font-semibold" style={{ color: SA.text }}>Recent Activity</h2>
          {overview.error ? (
            <ErrorState message={overview.error} onRetry={() => overview.reload()} />
          ) : (
            <ul className="space-y-2">
              {!overview.data && Array.from({ length: 4 }, (_, i) => <li key={i} className="h-12 animate-pulse rounded-lg bg-gray-50" />)}
              {overview.data?.activity.length === 0 && <li className="py-6 text-center text-sm" style={{ color: SA.muted }}>Nothing yet</li>}
              {overview.data?.activity.map((a, i) => {
                const security = a.type.startsWith("security:");
                return (
                  <li key={`${a.type}-${a.at}-${i}`} className="flex gap-3 rounded-lg px-2 py-2" style={{ backgroundColor: "#F8F9FB" }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: security ? "#D32F2F" : "#2E7D32" }}>
                      <span aria-hidden className="material-icons text-[16px]">{security ? "gpp_maybe" : "person_add_alt"}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium" style={{ color: SA.text }}>{a.title}</p>
                      <p className="truncate text-[11px]" style={{ color: SA.muted }}>{a.detail}</p>
                      <p className="text-[10px]" style={{ color: "#A5A9B5" }}>{timeAgo(a.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {Boolean(summary?.pending) && status !== "pending" && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
          <span aria-hidden className="material-icons text-amber-500">hourglass_top</span>
          <p className="flex-1 text-sm text-amber-900">
            <b>{summary?.pending}</b> new {summary?.pending === 1 ? "account is" : "accounts are"} waiting for your approval.
          </p>
          <SAButton variant="outline" icon="checklist" onClick={() => { setStatus("pending"); setPage(1); }}>Review</SAButton>
        </div>
      )}

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>Registered Users</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email, company…" />
            <FilterSelect label="Filter by user type" value={role} onChange={(v) => { setRole(v); setPage(1); }}
              options={[{ value: "", label: "All user types" }, { value: "owner", label: "Business User" }, { value: "manager", label: "Administrator" }, { value: "staff", label: "Standard User" }]} />
            <FilterSelect label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
              options={[{ value: "", label: "All statuses" }, { value: "pending", label: "Pending Approval" }, { value: "active", label: "Active" }, { value: "rejected", label: "Rejected" }, { value: "unverified", label: "Unverified" }, { value: "inactive", label: "Inactive" }, { value: "blocked", label: "Blocked" }]} />
          </div>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={() => reload()} />
        ) : !loading && data?.items.length === 0 ? (
          <EmptyState
            title={status === "pending" && !query.search && !role ? "No accounts waiting for approval" : filtered ? "No users match" : "No users yet"}
            hint={status === "pending" ? "New sign-ups appear here for review." : filtered ? "Try a different search or filter." : undefined}
          />
        ) : (
          <>
            <DataTable columns={columns} rows={data?.items ?? []} rowKey={(u) => u.id} loading={loading && !data} />
            {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
          </>
        )}
      </Card>

      {editing !== undefined && <UserModal user={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { showToast(m); refresh(); }} />}
      {viewing && (
        <ProfileModal
          user={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onApprove={() => void approve(viewing)}
          onReject={() => { setRejecting(viewing); setViewing(null); }}
        />
      )}
      {rejecting && <RejectModal user={rejecting} onClose={() => setRejecting(null)} onRejected={(m) => { showToast(m); refresh(); }} />}
      {Toast}
    </>
  );
}
