"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppModal } from "@/components/ui/AppModal";
import { useToast } from "@/hooks/use-toast";
import { getTickets, updateTicket, type TicketRecord } from "@/services/super-admin-api";
import { fetchAllPages, usePagedList } from "./use-paged-list";
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
  timeAgo,
  useDebounced,
  type Column,
  type Tone,
} from "./ui";

export const TICKET_STATUS: Record<TicketRecord["status"], { tone: Tone; label: string }> = {
  open: { tone: "info", label: "Open" },
  in_progress: { tone: "warning", label: "In Progress" },
  resolved: { tone: "success", label: "Resolved" },
  closed: { tone: "neutral", label: "Closed" },
};

// Status colours carry an icon/label next to them, never colour alone.
const PRIORITY: Record<TicketRecord["priority"], { color: string; label: string }> = {
  high: { color: "#D32F2F", label: "High" },
  medium: { color: "#F57C00", label: "Medium" },
  low: { color: "#388E3C", label: "Low" },
};

function PriorityLabel({ priority }: { priority: TicketRecord["priority"] }) {
  const p = PRIORITY[priority];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
      <span style={{ color: SA.text }}>{p.label}</span>
    </span>
  );
}

function TicketModal({ ticket, onClose, onSaved }: { ticket: TicketRecord; onClose: () => void; onSaved: (m: string) => void }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [response, setResponse] = useState(ticket.admin_response ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateTicket(ticket.id, { status, priority, admin_response: response.trim() });
      onSaved(`Ticket ${ticket.ticket_code} updated`);
      onClose();
    } catch (err) {
      setError(friendlyError(err, "Failed to update ticket"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={`Ticket #${ticket.ticket_code}`}
      titleIcon="support_agent"
      size="lg"
      footer={
        <ModalFooter
          onReset={() => { setStatus(ticket.status); setPriority(ticket.priority); setResponse(ticket.admin_response ?? ""); }}
          onSave={() => void save()}
          saving={saving}
          saveLabel="Save & Reply"
        />
      }
    >
      <div className="space-y-4 text-sm">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-red-600" role="alert">{error}</p>}
        <div>
          <p className="text-base font-semibold" style={{ color: SA.text }}>{ticket.subject}</p>
          <p className="mt-1 text-xs" style={{ color: SA.muted }}>
            {ticket.requester_name} · {ticket.requester_email}
            {ticket.requester_phone ? ` · ${ticket.requester_phone}` : ""}
            {ticket.company_name ? ` · ${ticket.company_name}` : ""} · opened {timeAgo(ticket.created_at)}
          </p>
        </div>
        <p className="whitespace-pre-wrap rounded-lg px-3 py-3" style={{ backgroundColor: "#F5F6F8", color: SA.text }}>{ticket.description}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Status" value={status} onChange={(v) => setStatus(v as TicketRecord["status"])}
            options={Object.entries(TICKET_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
          <SelectInput label="Priority" value={priority} onChange={(v) => setPriority(v as TicketRecord["priority"])}
            options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} />
        </div>
        <TextInput label="Response to the user" value={response} onChange={setResponse} placeholder="The user sees this reply in the app under Help & Support" multiline />
        {ticket.responded_at && <p className="text-xs" style={{ color: SA.muted }}>Last replied {timeAgo(ticket.responded_at)}</p>}
      </div>
    </AppModal>
  );
}

export function SuperAdminSupportScreen() {
  const params = useSearchParams();
  const initialStatus = params.get("status") ?? "";
  return <TicketsList key={initialStatus} initialStatus={initialStatus} />;
}

function TicketsList({ initialStatus }: { initialStatus: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<TicketRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(search);
  const { showToast, Toast } = useToast();
  const query = { search: debounced.trim(), status, priority };
  const { data, loading, error, reload } = usePagedList(getTickets, { ...query, page, limit: 10 }, "Failed to load tickets");
  const s = data?.summary;
  const filtered = Boolean(query.search || status || priority);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getTickets, query);
      downloadCsv(`support-tickets-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Ticket", "Subject", "User", "Email", "Phone", "Company", "Priority", "Status", "Opened", "Response"],
        rows.map((t) => [t.ticket_code, t.subject, t.requester_name, t.requester_email, t.requester_phone, t.company_name, PRIORITY[t.priority].label, TICKET_STATUS[t.status].label, formatDate(t.created_at), t.admin_response]));
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<TicketRecord>[] = [
    { key: "id", header: "Ticket ID", render: (t) => <span className="whitespace-nowrap font-medium">#{t.ticket_code}</span> },
    { key: "subject", header: "Subject", render: (t) => <span className="line-clamp-2 max-w-[180px]">{t.subject}</span> },
    {
      key: "user",
      header: "User",
      render: (t) => (
        <div className="max-w-[170px]">
          <p className="truncate">{t.requester_email}</p>
          {t.company_name && <p className="truncate text-[11px]" style={{ color: SA.muted }}>{t.company_name}</p>}
        </div>
      ),
    },
    { key: "priority", header: "Priority", render: (t) => <PriorityLabel priority={t.priority} /> },
    { key: "number", header: "Number", render: (t) => <span className="whitespace-nowrap">{t.requester_phone || "—"}</span> },
    { key: "date", header: "Date", render: (t) => <span className="whitespace-nowrap">{formatDate(t.created_at)}</span> },
    { key: "status", header: "Status", render: (t) => <Pill tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <button type="button" onClick={() => setViewing(t)} className="rounded px-3 py-1 text-[11px] font-medium text-white" style={{ backgroundColor: "#588157" }}>
          View
        </button>
      ),
    },
  ];

  const empty = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Support Request"
        subtitle="Tickets raised by business users from the Xtreme 360 app"
        actions={
          <>
            <SAButton icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>Export</SAButton>
            <SAButton variant="outline" icon="refresh" onClick={() => reload()}>Refresh</SAButton>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="confirmation_number" label="All Tickets" value={s?.total ?? 0} loading={!s} />
        <StatCard icon="mark_email_unread" label="Open" value={s?.open ?? 0} badge={s?.urgent ? `${s.urgent} high priority` : undefined} badgeTone="danger" loading={!s} />
        <StatCard icon="autorenew" label="In Progress" value={s?.in_progress ?? 0} loading={!s} />
        <StatCard icon="task_alt" label="Resolved / Closed" value={s?.resolved ?? 0} loading={!s} />
      </div>
      <Card className="p-4">
        {empty ? (
          <EmptyState title="No Support Tickets Yet" hint="Business users raise tickets from Utilities › Help & Support in the app." />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>All Support Tickets</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search ticket, subject, user…" />
                <FilterSelect label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
                  options={[{ value: "", label: "All statuses" }, ...Object.entries(TICKET_STATUS).map(([value, x]) => ({ value, label: x.label }))]} />
                <FilterSelect label="Filter by priority" value={priority} onChange={(v) => { setPriority(v); setPage(1); }}
                  options={[{ value: "", label: "All priorities" }, ...Object.entries(PRIORITY).map(([value, x]) => ({ value, label: x.label }))]} />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No tickets match" hint="Try a different search or filter." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(t) => t.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>
      {viewing && <TicketModal ticket={viewing} onClose={() => setViewing(null)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </>
  );
}
