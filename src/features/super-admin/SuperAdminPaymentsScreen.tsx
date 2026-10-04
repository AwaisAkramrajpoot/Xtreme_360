"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import {
  deletePayment,
  fieldErrors,
  getLicenses,
  getPayments,
  openPaymentAttachment,
  reviewPayment,
  savePayment,
  type LicenseRecord,
  type PaymentRecord,
} from "@/services/super-admin-api";
import { fetchAllPages, useAssignables, useCompanyOptions, useLoader, usePagedList } from "./use-paged-list";
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
  downloadCsv,
  formatDate,
  formatMoney,
  formatMoneyShort,
  friendlyError,
  todayIso,
  useDebounced,
  withoutError,
  type Column,
  type Tone,
} from "./ui";

const STATUS: Record<PaymentRecord["status"], { tone: Tone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  verified: { tone: "info", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
};
const MAX_RECEIPT = 10 * 1024 * 1024;

type PaymentForm = { company_id: string; branch_id: string; license_id: string; amount: string; status: PaymentRecord["status"]; payment_date: string; remarks: string };

const formFrom = (p: PaymentRecord | null): PaymentForm => ({
  company_id: p ? String(p.business_id) : "",
  branch_id: p?.branch_id ? String(p.branch_id) : "",
  license_id: p?.license_id ? String(p.license_id) : "",
  amount: p ? String(Number(p.amount)) : "",
  status: p?.status ?? "pending",
  payment_date: p?.payment_date ?? todayIso(),
  remarks: p?.remarks ?? "",
});

function PaymentModal({ payment, onClose, onSaved }: { payment: PaymentRecord | null; onClose: () => void; onSaved: (m: string) => void }) {
  const companies = useCompanyOptions();
  const [form, setForm] = useState<PaymentForm>(() => formFrom(payment));
  const { assignables } = useAssignables(form.company_id);
  const { data: companyLicenses } = useLoader(
    () => (form.company_id ? getLicenses({ company_id: form.company_id, limit: 100 }).then((r) => r.items) : Promise.resolve([] as LicenseRecord[])),
    `payment-licenses-${form.company_id}`,
    "Failed to load licenses"
  );
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof PaymentForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value, ...(key === "company_id" ? { branch_id: "", license_id: "" } : {}) }) as PaymentForm);
    setErrors((e) => withoutError(e, key));
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.company_id) next.company_id = "Select a company";
    if (!(Number(form.amount) > 0)) next.amount = "Enter an amount greater than 0";
    if (!form.payment_date) next.payment_date = "Choose the payment date";
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    const body = new FormData();
    body.append("company_id", form.company_id);
    body.append("branch_id", form.branch_id);
    body.append("license_id", form.license_id);
    body.append("amount", form.amount);
    body.append("status", form.status);
    body.append("payment_date", form.payment_date);
    body.append("remarks", form.remarks.trim());
    if (file) body.append("attachment", file);
    else if (payment && removeFile) body.append("remove_attachment", "true");
    setSaving(true);
    try {
      await savePayment(payment?.id ?? null, body);
      onSaved(payment ? "Payment updated" : "Payment recorded");
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setSubmitError(friendlyError(err, "Failed to save payment"));
    } finally {
      setSaving(false);
    }
  };

  const hasExisting = Boolean(payment?.has_attachment) && !removeFile;

  return (
    <AppModal
      open
      onClose={onClose}
      title={payment ? `Edit Payment ${payment.payment_code}` : "Add Manual Payment"}
      titleIcon="payments"
      size="lg"
      footer={<ModalFooter onReset={() => { setForm(formFrom(payment)); setFile(null); setRemoveFile(false); setErrors({}); setSubmitError(""); }} onSave={() => void save()} saving={saving} />}
    >
      <div className="space-y-4">
        {submitError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Company Name" value={form.company_id} onChange={set("company_id")} placeholder="Select company"
            options={companies.map((c) => ({ value: String(c.id), label: c.name }))} error={errors.company_id} required />
          <SelectInput label="Branch Name" value={form.branch_id} onChange={set("branch_id")} placeholder={form.company_id ? "No branch" : "Select a company first"}
            options={assignables.branches.map((b) => ({ value: String(b.id), label: `${b.code} · ${b.name}` }))} error={errors.branch_id} />
          <TextInput label="Payment ID" value={payment?.payment_code ?? "Assigned on save"} onChange={() => undefined} readOnly />
          <TextInput label="Amount" type="number" value={form.amount} onChange={set("amount")} placeholder="12500" error={errors.amount} required />
          <SelectInput label="Status" value={form.status} onChange={set("status")}
            options={[{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} />
          <TextInput label="Date" icon="event" type="date" value={form.payment_date} onChange={set("payment_date")} error={errors.payment_date} required />
        </div>
        <SelectInput label="For License" value={form.license_id} onChange={set("license_id")} placeholder={form.company_id ? "Not linked to a license" : "Select a company first"}
          options={(companyLicenses ?? []).map((l) => ({ value: String(l.id), label: `${l.license_key} · ${l.license_type}${l.user_name ? ` · ${l.user_name}` : ""}` }))}
          error={errors.license_id} />
        <TextInput label="Remarks" value={form.remarks} onChange={set("remarks")} placeholder="Contract renewal payment" error={errors.remarks} />
        <div>
          <FieldLabel>Attachment</FieldLabel>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="hidden"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (next && next.size > MAX_RECEIPT) {
                setErrors((x) => ({ ...x, attachment: "Attachment must be 10 MB or smaller" }));
                return;
              }
              setErrors((x) => withoutError(x, "attachment"));
              setFile(next);
            }} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-md border" style={{ borderColor: SA.border }} aria-label="Upload attachment">
              <span aria-hidden className="material-icons text-[18px]" style={{ color: SA.muted }}>file_upload</span>
            </button>
            {file ? (
              <span className="flex items-center gap-1" style={{ color: SA.text }}>
                {file.name}
                <button type="button" onClick={() => setFile(null)} aria-label="Remove selected file" className="text-red-500">
                  <span aria-hidden className="material-icons text-[16px] align-middle">close</span>
                </button>
              </span>
            ) : hasExisting ? (
              <span className="flex items-center gap-2" style={{ color: SA.text }}>
                <button type="button" className="underline" onClick={() => void openPaymentAttachment(payment!.id)}>{payment?.attachment_name || "Current receipt"}</button>
                <button type="button" onClick={() => setRemoveFile(true)} aria-label="Remove current receipt" className="text-red-500">
                  <span aria-hidden className="material-icons text-[16px] align-middle">close</span>
                </button>
              </span>
            ) : (
              <span style={{ color: SA.muted }}>Image or PDF, up to 10 MB</span>
            )}
          </div>
          {errors.attachment && <span className="mt-1 block text-xs text-red-500">{errors.attachment}</span>}
        </div>
      </div>
    </AppModal>
  );
}

export function SuperAdminPaymentsScreen() {
  const params = useSearchParams();
  const initialStatus = params.get("status") ?? "";
  return <PaymentsList key={initialStatus} initialStatus={initialStatus} />;
}

function PaymentsList({ initialStatus }: { initialStatus: string }) {
  const companies = useCompanyOptions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PaymentRecord | null | undefined>(undefined);
  const [busy, setBusy] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(search);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const query = { search: debounced.trim(), status };
  const { data, loading, error, reload } = usePagedList(getPayments, { ...query, page, limit: 10 }, "Failed to load payments");
  const s = data?.summary;
  const filtered = Boolean(query.search || status);

  const review = async (p: PaymentRecord, next: PaymentRecord["status"]) => {
    if (next === "rejected") {
      const ok = await confirm({ title: "Reject payment", message: `Reject ${p.payment_code} (${formatMoney(p.amount)}) from ${p.company_name}?`, confirmLabel: "Reject", danger: true });
      if (!ok) return;
    }
    setBusy(p.id);
    try {
      showToast(await reviewPayment(p.id, next));
      reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to update payment"), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: PaymentRecord) => {
    const ok = await confirm({ title: "Delete payment", message: `Delete ${p.payment_code}? Its receipt is removed too.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deletePayment(p.id);
      showToast("Payment deleted");
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      showToast(friendlyError(err, "Failed to delete payment"), "error");
    }
  };

  const viewReceipt = async (p: PaymentRecord) => {
    try {
      await openPaymentAttachment(p.id);
    } catch (err) {
      showToast(friendlyError(err, "Could not open the receipt"), "error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchAllPages(getPayments, query);
      downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Payment ID", "Company", "Branch", "License", "Amount", "Date", "Status", "Remarks", "Reviewed by", "Reviewed at"],
        rows.map((p) => [p.payment_code, p.company_name, p.branch_name, p.license_key, Number(p.amount), p.payment_date, STATUS[p.status].label, p.remarks, p.reviewed_by_name, p.reviewed_at ? formatDate(p.reviewed_at) : ""]));
    } catch (err) {
      showToast(friendlyError(err, "Export failed"), "error");
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<PaymentRecord>[] = [
    { key: "id", header: "Payment ID", render: (p) => <span className="whitespace-nowrap font-medium">#{p.payment_code}</span> },
    { key: "company", header: "Company", render: (p) => <span className="line-clamp-2 max-w-[140px]">{p.company_name}</span> },
    { key: "branch", header: "Branch", render: (p) => <span className="line-clamp-2 max-w-[120px]">{p.branch_name || "—"}</span> },
    { key: "amount", header: "Amount", render: (p) => <span className="whitespace-nowrap">{formatMoney(p.amount)}</span> },
    {
      key: "attachment",
      header: "Attachment",
      render: (p) =>
        p.has_attachment ? (
          <button type="button" onClick={() => void viewReceipt(p)} className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "#1E6FD955", color: "#1E6FD9" }}>View</button>
        ) : (
          <span style={{ color: SA.muted }}>—</span>
        ),
    },
    { key: "remarks", header: "Remarks", render: (p) => <span className="line-clamp-2 max-w-[160px]">{p.remarks || "—"}</span> },
    { key: "date", header: "Date", render: (p) => <span className="whitespace-nowrap">{formatDate(p.payment_date)}</span> },
    { key: "status", header: "Status", render: (p) => <Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill> },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(p)} className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "#1E6FD955", color: "#1E6FD9" }}>Edit</button>
          {p.status !== "verified" && (
            <button type="button" disabled={busy === p.id} onClick={() => void review(p, "verified")} className="rounded px-2 py-0.5 text-[11px] font-medium text-white disabled:opacity-50" style={{ backgroundColor: "#29B6F6" }}>Verify</button>
          )}
          {p.status === "pending" && (
            <button type="button" disabled={busy === p.id} onClick={() => void review(p, "rejected")} className="rounded border px-2 py-0.5 text-[11px] disabled:opacity-50" style={{ borderColor: "#C6282855", color: "#C62828" }}>Reject</button>
          )}
          {p.status !== "pending" && (
            <button type="button" disabled={busy === p.id} onClick={() => void review(p, "pending")} className="rounded border px-2 py-0.5 text-[11px] disabled:opacity-50" style={{ borderColor: SA.border, color: SA.muted }}>Reopen</button>
          )}
          <RowAction icon="delete" label={`Delete ${p.payment_code}`} color="#E91E63" onClick={() => void remove(p)} />
        </div>
      ),
    },
  ];

  const reviewed = s ? s.verified + s.rejected : 0;
  const successRate = reviewed ? Math.round((s!.verified / reviewed) * 1000) / 10 : 0;
  const rejectRate = reviewed ? Math.round((s!.rejected / reviewed) * 1000) / 10 : 0;
  const empty = !loading && !error && data && data.total === 0 && !filtered;

  return (
    <>
      <PageHeader
        title="Payment Verification"
        subtitle="Record, review and verify license payments"
        actions={
          <>
            <SAButton icon="add" onClick={() => setEditing(null)} disabled={!companies.length}>Add Payment</SAButton>
            <SAButton icon="file_download" onClick={() => void exportCsv()} loading={exporting} disabled={!data?.total}>Export</SAButton>
            <SAButton variant="outline" icon="refresh" onClick={() => reload()}>Refresh</SAButton>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="receipt_long" label="Total Payment" value={s?.total ?? 0} badge={s ? `+${s.this_month} this month` : undefined} loading={!s} />
        <StatCard icon="pending_actions" label="Pending Verification" value={s?.pending ?? 0} badge={s?.pending ? "Requires attention" : "All clear"} badgeTone={s?.pending ? "danger" : "success"} loading={!s} />
        <StatCard icon="verified" label="Verified Payments" value={s ? formatMoneyShort(s.verified_amount) : 0} badge={s ? `${successRate}% success rate` : undefined} loading={!s} />
        <StatCard icon="cancel" label="Rejected Payment" value={s?.rejected ?? 0} badge={s ? `${rejectRate}% rejection rate` : undefined} badgeTone="neutral" loading={!s} />
      </div>
      <Card className="p-4">
        {empty ? (
          <EmptyState title={companies.length ? "Add Payment First!" : "Add Company First!"} hint="Record payments received from companies and verify them here."
            action={companies.length ? <SAButton icon="add" onClick={() => setEditing(null)}>Add Payment</SAButton> : undefined} />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: SA.text }}>Payment Requests</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search ID, company, remarks…" />
                <FilterSelect label="Filter by status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
                  options={[{ value: "", label: "All statuses" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} />
              </div>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={() => reload()} />
            ) : !loading && data?.items.length === 0 ? (
              <EmptyState title="No payments match" hint="Try a different search or status." />
            ) : (
              <>
                <DataTable columns={columns} rows={data?.items ?? []} rowKey={(p) => p.id} loading={loading && !data} />
                {data && <Pagination page={data.page} pages={data.pages} total={data.total} limit={data.limit} onPage={setPage} />}
              </>
            )}
          </>
        )}
      </Card>
      {editing !== undefined && <PaymentModal payment={editing} onClose={() => setEditing(undefined)} onSaved={(m) => { showToast(m); reload(); }} />}
      {Toast}
    </>
  );
}
