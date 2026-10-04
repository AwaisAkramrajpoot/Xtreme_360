"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  deleteCompany,
  getCompanies,
  setCompanyBlocked,
  type CompanyRecord,
} from "@/services/super-admin-api";
import { CompanyModal } from "./CompanyModal";
import { fetchAllPages, usePagedList } from "./use-paged-list";
import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  Pill,
  RowAction,
  SA,
  SAButton,
  SearchBox,
  StatCard,
  downloadCsv,
  formatDate,
  friendlyError,
  useDebounced,
  type Column,
} from "./ui";

const STATUS: Record<string, { tone: "info" | "warning" | "danger"; label: string }> = {
  active: { tone: "info", label: "Active" },
  unverified: { tone: "warning", label: "Unverified" },
  blocked: { tone: "danger", label: "Blocked" },
};

const statusOf = (c: CompanyRecord) => (c.is_blocked ? "blocked" : c.owner_verified ? "active" : "unverified");

/** Remounts when the header search changes ?search=, so the list starts from that query. */
export function SuperAdminCompaniesScreen() {
  const params = useSearchParams();
  const initialSearch = params.get("search") ?? "";
  return <CompaniesList key={initialSearch} initialSearch={initialSearch} initialStatus={params.get("status") ?? ""} />;
}

function CompaniesList({ initialSearch, initialStatus }: { initialSearch: string; initialStatus: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CompanyRecord | null | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();

  const { data, loading, error, reload } = usePagedList(
    getCompanies,
    { search: debouncedSearch.trim(), status, page, limit: 10 },
    "Failed to load companies"
  );
  const filtered = Boolean(debouncedSearch.trim() || status);
  const summary = data?.summary;

  const toggleBlock = async (c: CompanyRecord) => {
    const block = !c.is_blocked;
    const ok = await confirm({
      title: block ? "Block company" : "Unblock company",
      message: block
        ? `Block ${c.name}? The owner and all team members are signed out and cannot use Xtreme 360 until unblocked.`
        : `Unblock ${c.name}? The owner and team can sign in again.`,
      confirmLabel: block ? "Block" : "Unblock",
      danger: block,
    });
    if (!ok) return;
    try {
      await setCompanyBlocked(c.id, block);
      showToast(block ? "Company blocked" : "Company unblocked");
      await reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to update company"), "error");
    }
  };

  const remove = async (c: CompanyRecord) => {
    const ok = await confirm({
      title: "Delete company",
      message: `Permanently delete ${c.name}? Its owner login (${c.owner_email}), ${c.team_count} team member(s), ${c.branch_count} branch(es) and all business data are removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      showToast(await deleteCompany(c.id));
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else await reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to delete company"), "error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getCompanies, { search: debouncedSearch.trim(), status });
      downloadCsv(
        `companies-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Company", "Email", "Number", "Address", "Website", "Type", "Category", "Owner", "Owner email", "Team", "Branches", "Registered", "Status"],
        rows.map((c) => [
          c.name, c.email, c.mobile_number, c.address, c.website, c.type, c.category, c.owner_name, c.owner_email,
          c.team_count, c.branch_count, formatDate(c.created_at), STATUS[statusOf(c)].label,
        ])
      );
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<CompanyRecord>[] = [
    {
      key: "name",
      header: "Company Name",
      render: (c) => (
        <div className="flex items-center gap-2">
          {c.business_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.business_logo} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-500">
              {c.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="max-w-[180px] truncate font-medium">{c.name}</p>
            <p className="max-w-[180px] truncate text-[11px]" style={{ color: SA.muted }}>
              {c.owner_name} · {c.team_count} team · {c.branch_count} branch
            </p>
          </div>
        </div>
      ),
    },
    { key: "address", header: "Address", render: (c) => <span className="line-clamp-2 max-w-[160px]">{c.address}</span> },
    { key: "number", header: "Number", render: (c) => <span className="whitespace-nowrap">{c.mobile_number}</span> },
    { key: "email", header: "Email", render: (c) => <span className="break-all">{c.email}</span> },
    { key: "date", header: "Reg. Date", render: (c) => <span className="whitespace-nowrap">{formatDate(c.created_at)}</span> },
    {
      key: "status",
      header: "Status",
      render: (c) => {
        const s = STATUS[statusOf(c)];
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex items-center gap-0.5">
          <RowAction icon="edit_note" label={`Edit ${c.name}`} color="#1E6FD9" onClick={() => setEditing(c)} />
          <RowAction icon="delete" label={`Delete ${c.name}`} color="#E91E63" onClick={() => void remove(c)} />
          <RowAction
            icon={c.is_blocked ? "lock_open" : "block"}
            label={c.is_blocked ? `Unblock ${c.name}` : `Block ${c.name}`}
            color={c.is_blocked ? "#2E7D32" : "#0288D1"}
            onClick={() => void toggleBlock(c)}
          />
        </div>
      ),
    },
  ];

  const noCompaniesAtAll = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Create and manage the companies using Xtreme 360"
        actions={
          <>
            <SAButton icon="add" onClick={() => setEditing(null)}>
              Add Company
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

      {!noCompaniesAtAll && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="apartment" label="Total Companies" value={summary?.total ?? 0} badge={summary ? `+${summary.this_month} this month` : undefined} loading={!summary} />
          <StatCard icon="verified" label="Active" value={summary?.active ?? 0} loading={!summary} />
          <StatCard icon="block" label="Blocked" value={summary?.blocked ?? 0} badgeTone="danger" loading={!summary} />
          <StatCard icon="pending_actions" label="Unverified Owners" value={summary?.unverified ?? 0} loading={!summary} />
        </div>
      )}

      <Card className="p-4">
        {noCompaniesAtAll ? (
          <EmptyState
            title="Add Company First!"
            hint="Companies you create here get an owner login for the Xtreme 360 app."
            action={
              <SAButton icon="add" onClick={() => setEditing(null)}>
                Add Company
              </SAButton>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>
                Registered Companies
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  placeholder="Search name, email, number…"
                />
                <FilterSelect
                  label="Filter by status"
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "active", label: "Active" },
                    { value: "unverified", label: "Unverified" },
                    { value: "blocked", label: "Blocked" },
                  ]}
                />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => void reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No companies match" hint="Try a different search or status." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(c) => c.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>

      {editing !== undefined && (
        <CompanyModal
          company={editing}
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
