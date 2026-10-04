"use client";

import { useId, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { IconButton } from "@/components/ui/IconButton";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { formatMoney } from "@/constants/app-settings";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { useLoadingStore } from "@/stores/loading-store";
import { getApiErrorMessage } from "@/utils/api-error";
import {
  closeFinancialYear,
  deleteBinEntry,
  downloadBackup,
  emailBackup,
  emptyRecycleBin,
  getFinancialYears,
  getRecycleBin,
  reopenFinancialYear,
  restoreBackup,
  restoreBinEntry,
  type BackupFile,
  type BinEntry,
  type FinancialYear,
  type FinancialYearsResponse,
} from "@/services/data-tools-api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const card = "rounded-2xl border bg-white p-4 lg:p-5";
const btn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-sm text-red-500">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className={`${btn} text-white`} style={{ backgroundColor: AppColors.primary }}>
        Retry
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Close financial years                                               */
/* ------------------------------------------------------------------ */

const STATUS_STYLE: Record<FinancialYear["status"], { label: string; color: string; bg: string }> = {
  closed: { label: "Closed", color: AppColors.redText, bg: "#FDECEC" },
  ended: { label: "Ended · open", color: "#8A6200", bg: "#FFF8E6" },
  current: { label: "Current", color: AppColors.greenText, bg: "#EAF6EA" },
};

export function CloseFinancialYearsScreen() {
  const general = useSettingsStore((s) => s.app.general);
  const patchSection = useSettingsStore((s) => s.patchSection);
  const money = (v: number) => formatMoney(v, general);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsyncData<FinancialYearsResponse | null>(
    async () => (await getFinancialYears()) ?? null,
    null,
    "Failed to load financial years"
  );
  const anyClosed = Boolean(data?.years.some((y) => y.status === "closed"));

  const changeStartMonth = async (month: number) => {
    try {
      await patchSection("general", { fyStartMonth: month });
      showToast("Financial year start updated");
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to update"), "error");
    }
  };

  const close = async (year: FinancialYear) => {
    const ok = await confirm({
      title: `Close ${year.label}`,
      message: `Entries dated ${formatDate(year.start_date)} – ${formatDate(year.end_date)} will be locked: they can't be added, edited or deleted until you reopen this year.`,
      confirmLabel: "Close year",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await closeFinancialYear(year.start_date, year.end_date);
      showToast(`${year.label} closed`);
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to close year"), "error");
    } finally {
      setBusy(false);
    }
  };

  const reopen = async (year: FinancialYear) => {
    const ok = await confirm({ title: `Reopen ${year.label}`, message: "Entries in this year can be changed again.", confirmLabel: "Reopen" });
    if (!ok) return;
    setBusy(true);
    try {
      await reopenFinancialYear();
      showToast(`${year.label} reopened`);
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to reopen year"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Close Financial Years" subtitle="Lock finished years so their books can't change" showBack />

      <section className={`${card} mb-4 flex flex-wrap items-center justify-between gap-3`} style={{ borderColor: AppColors.lightGrey }}>
        <div>
          <p className="font-semibold text-black">Financial year starts in</p>
          <p className="text-xs" style={{ color: AppColors.grey }}>
            {anyClosed ? "Reopen all closed years to change this." : "Used to group transactions into years."}
          </p>
        </div>
        <select
          value={general.fyStartMonth}
          disabled={anyClosed}
          onChange={(e) => void changeStartMonth(Number(e.target.value))}
          className="h-10 rounded-lg border bg-white px-3 text-sm disabled:opacity-60"
          style={{ borderColor: AppColors.lightGrey }}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </section>

      {data?.lock_date && (
        <p className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FDECEC", color: "#8A2B2B" }}>
          <span className="material-icons text-[18px]" aria-hidden>lock</span>
          Books are locked up to {formatDate(data.lock_date)}.
        </p>
      )}

      {loading && !data && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      <div className="grid grid-cols-1 gap-3 pb-10 lg:grid-cols-2">
        {data?.years.map((year) => {
          const status = STATUS_STYLE[year.status];
          return (
            <div key={year.start_date} className={card} style={{ borderColor: AppColors.lightGrey }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-black">{year.label}</p>
                  <p className="text-sm" style={{ color: AppColors.grey }}>
                    {formatDate(year.start_date)} – {formatDate(year.end_date)}
                  </p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: status.color, backgroundColor: status.bg }}>
                  {status.label}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {[
                  ["Sales", year.totals.sales],
                  ["Purchases", year.totals.purchases],
                  ["Expenses", year.totals.expenses],
                  ["Other income", year.totals.other_income],
                  ["Net profit", year.totals.net_profit],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-xs" style={{ color: AppColors.grey }}>{label}</dt>
                    <dd className="font-semibold tabular-nums" style={{ color: Number(value) < 0 ? AppColors.redText : AppColors.black }}>
                      {money(Number(value))}
                    </dd>
                  </div>
                ))}
              </dl>
              {(year.can_close || year.can_reopen) && (
                <div className="mt-4 flex justify-end">
                  {year.can_close && (
                    <button type="button" disabled={busy} onClick={() => void close(year)} className={`${btn} text-white`} style={{ backgroundColor: AppColors.primary }}>
                      <span className="material-icons text-[18px]" aria-hidden>lock</span>
                      Close year
                    </button>
                  )}
                  {year.can_reopen && (
                    <button type="button" disabled={busy} onClick={() => void reopen(year)} className={`${btn} border bg-white`} style={{ borderColor: AppColors.lightGrey }}>
                      <span className="material-icons text-[18px]" aria-hidden>lock_open</span>
                      Reopen
                    </button>
                  )}
                </div>
              )}
              {year.status === "current" && (
                <p className="mt-3 text-xs" style={{ color: AppColors.grey }}>Can be closed after {formatDate(year.end_date)}.</p>
              )}
            </div>
          );
        })}
      </div>
      {Toast}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recycle bin                                                         */
/* ------------------------------------------------------------------ */

export function RecycleBinScreen() {
  const general = useSettingsStore((s) => s.app.general);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getRecycleBin, [] as BinEntry[], "Failed to load recycle bin");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((e) => [e.kind, e.label].some((v) => v && v.toLowerCase().includes(q)));
  }, [data, search]);

  const restore = async (entry: BinEntry) => {
    setBusyId(entry.id);
    try {
      showToast(await restoreBinEntry(entry.id));
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to restore"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const purge = async (entry: BinEntry) => {
    const ok = await confirm({ title: "Delete permanently", message: `Permanently delete "${entry.label}"? This can't be undone.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteBinEntry(entry.id);
      showToast("Deleted permanently");
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete"), "error");
    }
  };

  const empty = async () => {
    const ok = await confirm({ title: "Empty recycle bin", message: `Permanently delete all ${data.length} items? This can't be undone.`, confirmLabel: "Empty bin", danger: true });
    if (!ok) return;
    try {
      await emptyRecycleBin();
      showToast("Recycle bin emptied");
      reload();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to empty bin"), "error");
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar
        title="Recycle Bin"
        subtitle="Deleted parties, employees, expenses, income, events and documents are kept for 30 days"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search deleted items"
        actions={
          data.length ? (
            <button type="button" onClick={() => void empty()} className={`${btn} border bg-white text-red-600`} style={{ borderColor: AppColors.lightGrey }}>
              Empty bin
            </button>
          ) : undefined
        }
      />

      {loading && !data.length && <div className="h-40 animate-pulse rounded-2xl bg-white" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && !filtered.length && (
        <div className="flex flex-col items-center gap-2 py-16 text-center" style={{ color: AppColors.grey }}>
          <span className="material-icons text-5xl" aria-hidden>delete_outline</span>
          <p className="text-sm">{data.length ? "No deleted items match your search." : "The recycle bin is empty."}</p>
        </div>
      )}

      <div className="space-y-3 pb-10">
        {filtered.map((entry) => (
          <div key={entry.id} className={`${card} flex flex-wrap items-center gap-3`} style={{ borderColor: AppColors.lightGrey }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: AppColors.primary }}>{entry.kind}</p>
              <p className="truncate font-semibold text-black">{entry.label || `#${entry.entity_id}`}</p>
              <p className="text-xs" style={{ color: AppColors.grey }}>
                Deleted {new Date(entry.deleted_at).toLocaleString()}
                {entry.entry_date ? ` · dated ${formatDate(entry.entry_date)}` : ""}
                {` · ${entry.days_left} ${entry.days_left === 1 ? "day" : "days"} left`}
              </p>
            </div>
            {entry.amount != null && (
              <p className="shrink-0 font-semibold tabular-nums">{formatMoney(entry.amount, general)}</p>
            )}
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={busyId === entry.id}
                onClick={() => void restore(entry)}
                className={`${btn} h-9 text-white`}
                style={{ backgroundColor: AppColors.primary }}
              >
                <span className="material-icons text-[18px]" aria-hidden>restore</span>
                {busyId === entry.id ? "Restoring…" : "Restore"}
              </button>
              <IconButton icon="delete_forever" label="Delete permanently" variant="delete" onClick={() => void purge(entry)} />
            </div>
          </div>
        ))}
      </div>
      {Toast}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Backup & restore                                                    */
/* ------------------------------------------------------------------ */

export function BackupAndRestoreScreen() {
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const email = useSessionProfileStore((s) => s.user?.email);
  const inputId = useId();
  const [restoreError, setRestoreError] = useState("");

  const download = async () => {
    showLoading("Preparing backup…");
    try {
      const blob = await downloadBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `xtreme360-backup-${new Date().toLocaleDateString("en-CA")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("Backup downloaded");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to create backup"), "error");
    } finally {
      hideLoading();
    }
  };

  const sendByEmail = async () => {
    showLoading("Emailing backup…");
    try {
      showToast(`Backup emailed to ${await emailBackup()}`);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to email backup"), "error");
    } finally {
      hideLoading();
    }
  };

  const restore = async (file: File | undefined) => {
    setRestoreError("");
    if (!file) return;
    let backup: BackupFile;
    try {
      backup = JSON.parse(await file.text());
      if (backup?.format !== "xtreme360-backup") throw new Error();
    } catch {
      setRestoreError("This is not a valid Xtreme360 backup file.");
      return;
    }
    const total = Object.values(backup.counts || {}).reduce((s, n) => s + Number(n || 0), 0);
    const ok = await confirm({
      title: "Restore backup",
      message: `This replaces ALL current data in this account with the backup from ${new Date(backup.created_at).toLocaleString()} (${total} records). Anything added after that backup will be lost.`,
      confirmLabel: "Replace my data",
      danger: true,
    });
    if (!ok) return;
    showLoading("Restoring backup…");
    try {
      await restoreBackup(backup);
      showToast("Backup restored — reloading");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setRestoreError(getApiErrorMessage(err, "Failed to restore backup"));
    } finally {
      hideLoading();
    }
  };

  const tiles = [
    {
      icon: "download",
      title: "Download backup",
      text: "Save a complete copy of your business data (parties, items, sales, purchases, expenses, accounts, settings) to this device.",
      action: <button type="button" onClick={() => void download()} className={`${btn} text-white`} style={{ backgroundColor: AppColors.primary }}>Download</button>,
    },
    {
      icon: "mail",
      title: "Email backup",
      text: `Send the backup file as an attachment to ${email || "your account email"}.`,
      action: <button type="button" onClick={() => void sendByEmail()} className={`${btn} border bg-white`} style={{ borderColor: AppColors.lightGrey }}>Email me</button>,
    },
    {
      icon: "restore",
      title: "Restore backup",
      text: "Replace this account's data with a backup file made from this account.",
      action: (
        <label htmlFor={inputId} className={`${btn} cursor-pointer border bg-white text-red-600`} style={{ borderColor: AppColors.lightGrey }}>
          Choose file
          <input id={inputId} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void restore(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      ),
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Backup & Restore" subtitle="Keep a copy of your data and restore it when needed" showBack />
      <div className="grid grid-cols-1 gap-3 pb-10 lg:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.title} className={`${card} flex flex-col gap-3`} style={{ borderColor: AppColors.lightGrey }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "#EAF2EA", color: AppColors.primary }}>
              <span className="material-icons text-[22px]" aria-hidden>{t.icon}</span>
            </span>
            <div className="flex-1">
              <p className="font-semibold text-black">{t.title}</p>
              <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>{t.text}</p>
            </div>
            <div>{t.action}</div>
          </div>
        ))}
      </div>
      {restoreError && (
        <p role="alert" className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FDECEC", color: "#8A2B2B" }}>
          {restoreError}
        </p>
      )}
      {Toast}
    </div>
  );
}
