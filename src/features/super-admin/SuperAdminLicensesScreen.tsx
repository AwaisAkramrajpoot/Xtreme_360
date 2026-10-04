"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  assignLicense,
  expireLicense,
  fieldErrors,
  getLicenses,
  renewLicense,
  updateLicense,
  type LicenseRecord,
  type LicenseStatus,
} from "@/services/super-admin-api";
import { fetchAllPages, useAssignables, useCompanyOptions, usePagedList } from "./use-paged-list";
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  ModalFooter,
  PageHeader,
  Pagination,
  Pill,
  SA,
  SAButton,
  SearchBox,
  SelectInput,
  StatCard,
  TextInput,
  downloadCsv,
  formatDate,
  friendlyError,
  todayIso,
  useDebounced,
  withoutError,
  type Column,
  type Tone,
} from "./ui";

export const LICENSE_TYPES = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
];

export const LICENSE_STATUS: Record<LicenseStatus, { tone: Tone; label: string }> = {
  active: { tone: "info", label: "Active" },
  expiring: { tone: "warning", label: "Expiring Soon" },
  expired: { tone: "danger", label: "Expired" },
  revoked: { tone: "danger", label: "Expired" },
  available: { tone: "success", label: "Available" },
};

const typeLabel = (t: string) => LICENSE_TYPES.find((x) => x.value === t)?.label ?? t;

type LicenseForm = { company_id: string; branch_id: string; device_id: string; user_id: string; license_type: string; expires_at: string };

const formFrom = (l: LicenseRecord | null): LicenseForm => ({
  company_id: l ? String(l.business_id) : "",
  branch_id: l?.branch_id ? String(l.branch_id) : "",
  device_id: l?.device_id ? String(l.device_id) : "",
  user_id: l?.user_id ? String(l.user_id) : "",
  license_type: l?.license_type ?? "basic",
  expires_at: l?.expires_at ?? "",
});

/** "Assign New License" (create) and edit/assign of an existing key. */
export function LicenseModal({ license, onClose, onSaved }: { license: LicenseRecord | null; onClose: () => void; onSaved: (m: string) => void }) {
  const companies = useCompanyOptions();
  const [form, setForm] = useState<LicenseForm>(() => formFrom(license));
  const { assignables } = useAssignables(form.company_id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof LicenseForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "company_id" ? { branch_id: "", device_id: "", user_id: "" } : {}) }));
    setErrors((e) => withoutError(e, key));
  };
  const branchDevices = assignables.devices.filter((d) => !form.branch_id || !d.branch_id || String(d.branch_id) === form.branch_id);
  const branchUsers = assignables.users.filter((u) => !form.branch_id || !u.branch_id || String(u.branch_id) === form.branch_id);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.company_id) next.company_id = "Select a company";
    if (!license && !form.user_id && !form.device_id) next.user_id = "Select a user or a device";
    if (form.expires_at && form.expires_at < todayIso()) next.expires_at = "Expiry date cannot be in the past";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    const payload = {
      company_id: Number(form.company_id),
      branch_id: form.branch_id ? Number(form.branch_id) : null,
      device_id: form.device_id ? Number(form.device_id) : null,
      user_id: form.user_id ? Number(form.user_id) : null,
      license_type: form.license_type,
      expires_at: form.expires_at || null,
    };
    setSaving(true);
    try {
      if (license) await updateLicense(license.id, payload);
      else await assignLicense(payload);
      onSaved(license ? "License updated" : "License assigned");
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save license"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={license ? `Edit License ${license.license_key}` : "Assign New License"}
      titleIcon="workspace_premium"
      size="lg"
      footer={
        <ModalFooter
          onReset={() => { setForm(formFrom(license)); setErrors({}); setSubmitError(""); }}
          onSave={() => void save()}
          saving={saving}
          saveLabel={license ? "Update" : "Assign"}
        />
      }
    >
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Select Company" value={form.company_id} onChange={set("company_id")} placeholder="Select company"
            options={companies.map((c) => ({ value: String(c.id), label: c.name }))} error={errors.company_id} required />
          <SelectInput label="Select Branch" value={form.branch_id} onChange={set("branch_id")} placeholder={form.company_id ? "Any branch" : "Select a company first"}
            options={assignables.branches.map((b) => ({ value: String(b.id), label: `${b.code} · ${b.name}` }))} error={errors.branch_id} />
          <SelectInput label="Select Device" value={form.device_id} onChange={set("device_id")} placeholder={form.company_id ? "No device" : "Select a company first"}
            options={branchDevices.map((d) => ({ value: String(d.id), label: `${d.name} (${d.device_type})` }))} error={errors.device_id} />
          <SelectInput label="Select User" value={form.user_id} onChange={set("user_id")} placeholder={form.company_id ? "No user" : "Select a company first"}
            options={branchUsers.map((u) => ({ value: String(u.id), label: `${u.name} · ${u.role}` }))} error={errors.user_id} />
          <SelectInput label="License Type" value={form.license_type} onChange={set("license_type")} options={LICENSE_TYPES} />
          <TextInput label="Expiry Date" icon="event" type="date" value={form.expires_at} onChange={set("expires_at")} error={errors.expires_at} />
        </div>
        <p className="text-xs" style={{ color: SA.muted }}>
          Leave the expiry empty to use the default license duration from Settings. A key with no user and no device stays available.
        </p>
      </div>
    </AppModal>
  );
}

export function SuperAdminLicensesScreen() {
  const params = useSearchParams();
  const initialStatus = params.get("status") ?? "";
  return <LicensesList key={initialStatus} initialStatus={initialStatus} />;
}

function LicensesList({ initialStatus }: { initialStatus: string }) {
  const companies = useCompanyOptions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LicenseRecord | null | undefined>(undefined);
  const [busy, setBusy] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const query = { search: debounced.trim(), status, type };
  const { data, loading, error, reload } = usePagedList(getLicenses, { ...query, page, limit: 10 }, "Failed to load licenses");
  const s = data?.summary;
  const filtered = Boolean(query.search || status || type);

  const act = async (l: LicenseRecord, action: "renew" | "expire") => {
    if (action === "expire") {
      const ok = await confirm({ title: "Expire license", message: `Expire ${l.license_key} for ${l.company_name} now?`, confirmLabel: "Expire", danger: true });
      if (!ok) return;
    }
    setBusy(l.id);
    try {
      if (action === "renew") showToast(await renewLicense(l.id));
      else {
        await expireLicense(l.id);
        showToast("License expired");
      }
      reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to update license"), "error");
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getLicenses, query);
      downloadCsv(`licenses-${new Date().toISOString().slice(0, 10)}.csv`,
        ["License Key", "Company", "Branch", "User", "Device", "Type", "Assigned", "Expires", "Status"],
        rows.map((l) => [l.license_key, l.company_name, l.branch_name, l.user_name, l.device_name, typeLabel(l.license_type), l.assigned_at, l.expires_at, LICENSE_STATUS[l.status].label]));
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const smallBtn = (label: string, onClick: () => void, color: string, bg: string, disabled?: boolean) => (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded border px-2 py-0.5 text-[11px] font-medium disabled:opacity-40"
      style={{ color, backgroundColor: bg, borderColor: `${color}55` }}>
      {label}
    </button>
  );

  const columns: Column<LicenseRecord>[] = [
    {
      key: "company",
      header: "Company Name",
      render: (l) => (
        <div className="min-w-0">
          <p className="max-w-[170px] truncate font-medium">{l.company_name}</p>
          <p className="font-mono text-[10px]" style={{ color: SA.muted }}>{l.license_key}</p>
        </div>
      ),
    },
    { key: "user", header: "User", render: (l) => l.user_name || (l.device_name ? `Device: ${l.device_name}` : <span style={{ color: SA.muted }}>Unassigned</span>) },
    { key: "type", header: "License Type", render: (l) => typeLabel(l.license_type) },
    { key: "assigned", header: "Assigned Date", render: (l) => <span className="whitespace-nowrap">{formatDate(l.assigned_at)}</span> },
    {
      key: "expiry",
      header: "Expiry Date",
      render: (l) => (
        <span className="whitespace-nowrap">
          {formatDate(l.expires_at)}
          {l.status === "expiring" && l.days_left !== null && <span className="ml-1 text-[11px] text-orange-600">({l.days_left}d)</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (l) => <Pill tone={LICENSE_STATUS[l.status].tone}>{LICENSE_STATUS[l.status].label}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (l) => (
        <div className="flex items-center gap-1">
          {smallBtn("Edit", () => setEditing(l), "#1E6FD9", "#fff")}
          {smallBtn("Renew", () => void act(l, "renew"), "#2E7D32", "#EAF7EE", busy === l.id || l.status === "available")}
          {smallBtn("Expire", () => void act(l, "expire"), "#C62828", "#FDECEC", busy === l.id || l.status === "revoked" || l.status === "available")}
        </div>
      ),
    },
  ];

  const usedPct = s && s.total ? Math.round(((s.active + s.expiring) / s.total) * 100) : 0;
  const empty = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Create License"
        subtitle="Assign, renew and expire the licenses companies use"
        actions={
          <>
            <SAButton icon="add" onClick={() => setEditing(null)} disabled={!companies.length}>Assign</SAButton>
            <SAButton icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>Export</SAButton>
            <SAButton variant="outline" icon="refresh" onClick={() => reload()}>Refresh</SAButton>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="workspace_premium" label="Total Licenses" value={s?.total ?? 0} badge={s ? `+${s.this_month} this month` : undefined} loading={!s} />
        <StatCard icon="verified" label="Active Licenses" value={s?.active ?? 0} badge={s ? `${usedPct}% currently in use` : undefined} loading={!s} />
        <StatCard icon="schedule" label="Expiring Soon" value={s?.expiring ?? 0} badge={s ? `${s.urgent} urgent renewals` : undefined} badgeTone={s?.urgent ? "danger" : "neutral"} loading={!s} />
        <StatCard icon="inventory_2" label="Available Licenses" value={s?.available ?? 0} badge={s ? `${s.expired} expired` : undefined} badgeTone="neutral" loading={!s} />
      </div>
      <Card className="p-4">
        {empty ? (
          <EmptyState
            title={companies.length ? "Assign License First!" : "Add Company First!"}
            hint="Assign a license to a company user or device, or generate keys in Settings."
            action={companies.length ? <SAButton icon="add" onClick={() => setEditing(null)}>Assign</SAButton> : undefined}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>Registered Licenses</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search key, company, user…" />
                <FilterSelect label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
                  options={[{ value: "", label: "All statuses" }, { value: "active", label: "Active" }, { value: "expiring", label: "Expiring Soon" },
                    { value: "expired", label: "Expired" }, { value: "revoked", label: "Expired manually" }, { value: "available", label: "Available" }]} />
                <FilterSelect label="Filter by type" value={type} onChange={(v) => { setType(v); setPage(1); }} options={[{ value: "", label: "All types" }, ...LICENSE_TYPES]} />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No licenses match" hint="Try a different search or filter." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(l) => l.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>
      {editing !== undefined && <LicenseModal license={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </>
  );
}
