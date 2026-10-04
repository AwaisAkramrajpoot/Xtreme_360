"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import { deleteDevice, fieldErrors, getDevices, saveDevice, type DeviceRecord } from "@/services/super-admin-api";
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
  useDebounced,
  withoutError,
  type Column,
} from "./ui";

const DEVICE_TYPES = ["POS Terminal", "Scanner", "Printer", "Display", "Tablet", "Other"];

type DeviceForm = { company_id: string; branch_id: string; name: string; device_type: string; serial_number: string; active: boolean };

const formFrom = (d: DeviceRecord | null): DeviceForm => ({
  company_id: d ? String(d.business_id) : "",
  branch_id: d?.branch_id ? String(d.branch_id) : "",
  name: d?.name ?? "",
  device_type: d?.device_type ?? "POS Terminal",
  serial_number: d?.serial_number ?? "",
  active: d ? d.status === "active" : true,
});

function DeviceModal({ device, onClose, onSaved }: { device: DeviceRecord | null; onClose: () => void; onSaved: (m: string) => void }) {
  const companies = useCompanyOptions();
  const [form, setForm] = useState<DeviceForm>(() => formFrom(device));
  const { assignables } = useAssignables(form.company_id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof DeviceForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "company_id" ? { branch_id: "" } : {}) }));
    setErrors((e) => withoutError(e, key));
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.company_id) next.company_id = "Select a company";
    if (!form.name.trim()) next.name = "Device name is required";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await saveDevice(device?.id ?? null, {
        company_id: Number(form.company_id),
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        name: form.name.trim(),
        device_type: form.device_type,
        serial_number: form.serial_number.trim(),
        status: form.active ? "active" : "inactive",
      });
      onSaved(device ? "Device updated" : "Device added");
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save device"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={device ? "Edit Device" : "Add New Device"}
      titleIcon="point_of_sale"
      size="md"
      footer={<ModalFooter onReset={() => { setForm(formFrom(device)); setErrors({}); setSubmitError(""); }} onSave={() => void save()} saving={saving} />}
    >
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <SelectInput
          label="Select Company"
          value={form.company_id}
          onChange={set("company_id")}
          placeholder="Select company"
          options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
          error={errors.company_id}
          required
        />
        <SelectInput
          label="Select Branch"
          value={form.branch_id}
          onChange={set("branch_id")}
          placeholder={form.company_id ? "No branch" : "Select a company first"}
          options={assignables.branches.map((b) => ({ value: String(b.id), label: `${b.code} · ${b.name}` }))}
          error={errors.branch_id}
        />
        <TextInput label="Device Name" value={form.name} onChange={set("name")} placeholder="e.g. Counter 1" error={errors.name} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Device Type" value={form.device_type} onChange={set("device_type")} options={DEVICE_TYPES.map((t) => ({ value: t, label: t }))} />
          <TextInput label="Serial Number" value={form.serial_number} onChange={set("serial_number")} placeholder="Optional" error={errors.serial_number} />
        </div>
        <ToggleRow label="Status" hint={form.active ? "Active" : "Inactive"} value={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
      </div>
    </AppModal>
  );
}

export function SuperAdminDevicesScreen() {
  const companies = useCompanyOptions();
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DeviceRecord | null | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const query = { search: debounced.trim(), company_id: companyId, status };
  const { data, loading, error, reload } = usePagedList(getDevices, { ...query, page, limit: 10 }, "Failed to load devices");
  const summary = data?.summary;
  const filtered = Boolean(query.search || companyId || status);

  const remove = async (d: DeviceRecord) => {
    const ok = await confirm({ title: "Delete device", message: `Delete ${d.name}? Licenses assigned to it become unassigned.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteDevice(d.id);
      showToast("Device deleted");
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to delete device"), "error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getDevices, query);
      downloadCsv(`devices-${new Date().toISOString().slice(0, 10)}.csv`, ["Device", "Type", "Serial", "Company", "Branch", "License", "Status", "Added"],
        rows.map((d) => [d.name, d.device_type, d.serial_number, d.company_name, d.branch_name, d.license_key, d.status, formatDate(d.created_at)]));
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<DeviceRecord>[] = [
    { key: "name", header: "Device Name", render: (d) => <span className="font-medium">{d.name}</span> },
    { key: "type", header: "Type", render: (d) => d.device_type },
    { key: "serial", header: "Serial Number", render: (d) => d.serial_number || "—" },
    { key: "company", header: "Company", render: (d) => <span className="line-clamp-2 max-w-[160px]">{d.company_name}</span> },
    { key: "branch", header: "Branch", render: (d) => (d.branch_name ? `${d.branch_code} · ${d.branch_name}` : "—") },
    { key: "license", header: "License", render: (d) => (d.license_key ? <span className="font-mono text-[11px]">{d.license_key}</span> : <span style={{ color: SA.muted }}>None</span>) },
    { key: "status", header: "Status", render: (d) => <Pill tone={d.status === "active" ? "info" : "neutral"}>{d.status === "active" ? "Active" : "Inactive"}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <div className="flex items-center gap-0.5">
          <RowAction icon="edit_note" label={`Edit ${d.name}`} color="#1E6FD9" onClick={() => setEditing(d)} />
          <RowAction icon="delete" label={`Delete ${d.name}`} color="#E91E63" onClick={() => void remove(d)} />
        </div>
      ),
    },
  ];

  const empty = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Create Device"
        subtitle="POS terminals, scanners and other hardware used by companies"
        actions={
          <>
            <SAButton icon="add" onClick={() => setEditing(null)} disabled={!companies.length}>Add Device</SAButton>
            <SAButton icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>Export</SAButton>
            <SAButton variant="outline" icon="refresh" onClick={() => reload()}>Refresh</SAButton>
          </>
        }
      />
      {!empty && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="point_of_sale" label="Total Devices" value={summary?.total ?? 0} loading={!summary} />
          <StatCard icon="check_circle_outline" label="Active Devices" value={summary?.active ?? 0} loading={!summary} />
          <StatCard icon="do_not_disturb_on" label="Inactive Devices" value={summary?.inactive ?? 0} loading={!summary} />
          <StatCard icon="workspace_premium" label="Licensed Devices" value={summary?.licensed ?? 0} loading={!summary} />
        </div>
      )}
      <Card className="p-4">
        {empty ? (
          <EmptyState
            title={companies.length ? "Add Device First!" : "Add Company First!"}
            hint="Devices belong to a company and can hold a license."
            action={companies.length ? <SAButton icon="add" onClick={() => setEditing(null)}>Add Device</SAButton> : undefined}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>Registered Devices</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search device, serial, company…" />
                <FilterSelect label="Filter by company" value={companyId} onChange={(v) => { setCompanyId(v); setPage(1); }}
                  options={[{ value: "", label: "All companies" }, ...companies.map((c) => ({ value: String(c.id), label: c.name }))]} />
                <FilterSelect label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
                  options={[{ value: "", label: "All statuses" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No devices match" hint="Try a different search or filter." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(d) => d.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>
      {editing !== undefined && <DeviceModal device={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </>
  );
}
