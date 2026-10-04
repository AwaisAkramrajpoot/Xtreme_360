"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBranch,
  fieldErrors,
  getBranches,
  getCompanyOptions,
  saveBranch,
  type BranchRecord,
} from "@/services/super-admin-api";
import { fetchAllPages, usePagedList } from "./use-paged-list";
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FieldLabel,
  FilterSelect,
  LogoUpload,
  ModalFooter,
  PageHeader,
  Pagination,
  Pill,
  RowAction,
  SA,
  SAButton,
  SearchBox,
  SelectInput,
  TextInput,
  downloadCsv,
  formatDate,
  friendlyError,
  useDebounced,
  type Column,
} from "./ui";

type CompanyOption = { id: number; name: string };

type BranchForm = { company_id: string; code: string; name: string; address: string; city: string; phone: string; active: boolean };

const formFrom = (b: BranchRecord | null, defaultCompany = ""): BranchForm => ({
  company_id: b ? String(b.business_id) : defaultCompany,
  code: b?.code ?? "",
  name: b?.name ?? "",
  address: b?.address ?? "",
  city: b?.city ?? "",
  phone: b?.phone ?? "",
  active: b ? b.status === "active" : true,
});

function BranchModal({
  branch,
  companies,
  defaultCompany,
  onClose,
  onSaved,
}: {
  branch: BranchRecord | null;
  companies: CompanyOption[];
  defaultCompany: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<BranchForm>(() => formFrom(branch, defaultCompany));
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof BranchForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const rest = { ...e };
      delete rest[key];
      return rest;
    });
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.company_id) next.company_id = "Select a company";
    if (!form.code.trim()) next.code = "Branch code is required";
    if (!form.name.trim()) next.name = "Branch name is required";
    if (!form.address.trim()) next.address = "Branch address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;

    const body = new FormData();
    body.append("company_id", form.company_id);
    for (const key of ["code", "name", "address", "city", "phone"] as const) body.append(key, form[key].trim());
    body.append("status", form.active ? "active" : "inactive");
    if (logo) body.append("logo", logo);
    else if (branch && removeLogo) body.append("remove_logo", "true");

    setSaving(true);
    try {
      await saveBranch(branch?.id ?? null, body);
      onSaved(branch ? "Branch updated" : "Branch created");
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save branch"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={branch ? "Edit Branch" : "Add New Branch"}
      titleIcon="storefront"
      size="md"
      footer={
        <ModalFooter
          onReset={() => {
            setForm(formFrom(branch, defaultCompany));
            setLogo(null);
            setRemoveLogo(false);
            setErrors({});
            setSubmitError("");
          }}
          onSave={() => void save()}
          saving={saving}
        />
      }
    >
      <div className="space-y-4">
        {submitError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}
        <SelectInput
          label="Select Company"
          value={form.company_id}
          onChange={set("company_id")}
          placeholder={companies.length ? "Select company" : "No companies yet"}
          options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
          error={errors.company_id}
          required
        />
        <TextInput label="Branch Code" value={form.code} onChange={set("code")} placeholder="Enter branch code" error={errors.code} required />
        <TextInput label="Branch Name" value={form.name} onChange={set("name")} placeholder="Enter branch name" error={errors.name} required />
        <TextInput label="Branch Address" value={form.address} onChange={set("address")} placeholder="Enter branch address" error={errors.address} required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="City" value={form.city} onChange={set("city")} placeholder="Enter city" error={errors.city} required />
          <TextInput label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="Enter phone number" error={errors.phone} required />
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <div className="flex items-center gap-2">
            <AppSwitch value={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} ariaLabel="Branch active" />
            <span className="text-sm" style={{ color: SA.text }}>
              {form.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <LogoUpload
          label="Branch Logo"
          file={logo}
          existingUrl={removeLogo ? null : branch?.logo}
          onFile={setLogo}
          onRemoveExisting={() => setRemoveLogo(true)}
        />
      </div>
    </AppModal>
  );
}

export function SuperAdminBranchesScreen() {
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [editing, setEditing] = useState<BranchRecord | null | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getCompanyOptions()
      .then((rows) => {
        if (!cancelled) setCompanies(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const query = { search: debouncedSearch.trim(), company_id: companyId, status, page, limit: 10 };
  const { data, loading, error, reload } = usePagedList(getBranches, query, "Failed to load branches");
  const filtered = Boolean(debouncedSearch.trim() || companyId || status);

  const remove = async (b: BranchRecord) => {
    const ok = await confirm({
      title: "Delete branch",
      message: `Delete ${b.name} (${b.code}) from ${b.company_name}? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBranch(b.id);
      showToast("Branch deleted");
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else await reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to delete branch"), "error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getBranches, { search: debouncedSearch.trim(), company_id: companyId, status });
      downloadCsv(
        `branches-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Branch Code", "Branch Name", "Company", "Address", "City", "Phone", "Status", "Created"],
        rows.map((b) => [b.code, b.name, b.company_name, b.address, b.city, b.phone, b.status, formatDate(b.created_at)])
      );
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<BranchRecord>[] = [
    { key: "code", header: "Branch Code", render: (b) => <span className="font-medium">{b.code}</span> },
    {
      key: "name",
      header: "Branch Name",
      render: (b) => (
        <div className="flex items-center gap-2">
          {b.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />
          )}
          <div className="min-w-0">
            <p className="max-w-[160px] truncate">{b.name}</p>
            <p className="max-w-[160px] truncate text-[11px]" style={{ color: SA.muted }}>
              {b.company_name}
            </p>
          </div>
        </div>
      ),
    },
    { key: "address", header: "Branch Address", render: (b) => <span className="line-clamp-2 max-w-[180px]">{b.address}</span> },
    { key: "city", header: "City", render: (b) => b.city },
    { key: "phone", header: "Phone Number", render: (b) => <span className="whitespace-nowrap">{b.phone}</span> },
    {
      key: "status",
      header: "Status",
      render: (b) => <Pill tone={b.status === "active" ? "info" : "neutral"}>{b.status === "active" ? "Active" : "Inactive"}</Pill>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (b) => (
        <div className="flex items-center gap-0.5">
          <RowAction icon="edit_note" label={`Edit ${b.name}`} color="#1E6FD9" onClick={() => setEditing(b)} />
          <RowAction icon="delete" label={`Delete ${b.name}`} color="#E91E63" onClick={() => void remove(b)} />
        </div>
      ),
    },
  ];

  const empty = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Branches"
        subtitle="Branches of every company on the platform"
        actions={
          <>
            <SAButton icon="add" onClick={() => setEditing(null)} disabled={!companies.length} title={companies.length ? undefined : "Add a company first"}>
              Add Branch
            </SAButton>
            <SAButton icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>
              Export
            </SAButton>
            <SAButton variant="outline" icon="refresh" onClick={() => void reload()}>
              Refresh
            </SAButton>
          </>
        }
      />

      <Card className="p-4">
        {empty ? (
          <EmptyState
            title={companies.length ? "Add Branch First!" : "Add Company First!"}
            hint={companies.length ? "Branches belong to a company." : "A branch needs a company. Create one on the Companies page."}
            action={
              companies.length ? (
                <SAButton icon="add" onClick={() => setEditing(null)}>
                  Add Branch
                </SAButton>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>
                Registered Branches
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search code, name, city…" />
                <FilterSelect
                  label="Filter by company"
                  value={companyId}
                  onChange={(v) => { setCompanyId(v); setPage(1); }}
                  options={[{ value: "", label: "All companies" }, ...companies.map((c) => ({ value: String(c.id), label: c.name }))]}
                />
                <FilterSelect
                  label="Filter by status"
                  value={status}
                  onChange={(v) => { setStatus(v); setPage(1); }}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => void reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No branches match" hint="Try a different search or filter." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(b) => b.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>

      {editing !== undefined && (
        <BranchModal
          branch={editing}
          companies={companies}
          defaultCompany={companyId}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            showToast(message);
            void reload();
          }}
        />
      )}
      {Toast}
    </>
  );
}
