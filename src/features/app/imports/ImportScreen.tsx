"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppColors } from "@/constants/colors";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/utils/api-error";
import { downloadCsv } from "@/features/app/reports/report-format";
import {
  IMPORT_CONFIGS,
  mapHeaders,
  parseCsv,
  templateCsv,
  validateRow,
  type ImportKind,
  type ParsedRow,
} from "./import-config";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_ROWS = 1000;

type PreviewRow = {
  line: number;
  row: ParsedRow;
  errors: string[];
  duplicate: boolean;
  status?: "imported" | "failed" | "skipped";
  message?: string;
};

type Stage = "select" | "preview" | "importing" | "done";

const button = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50";

export function ImportScreen({ kind }: { kind: ImportKind }) {
  const config = IMPORT_CONFIGS[kind];
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();
  const { showToast, Toast } = useToast();
  const [stage, setStage] = useState<Stage>("select");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const counts = useMemo(() => {
    const invalid = rows.filter((r) => r.errors.length).length;
    const duplicates = rows.filter((r) => !r.errors.length && r.duplicate).length;
    const ready = rows.length - invalid - (skipDuplicates ? duplicates : 0);
    return {
      invalid,
      duplicates,
      ready,
      imported: rows.filter((r) => r.status === "imported").length,
      failed: rows.filter((r) => r.status === "failed").length,
    };
  }, [rows, skipDuplicates]);

  const reset = () => {
    setStage("select");
    setFileName("");
    setFileError("");
    setUnmapped([]);
    setRows([]);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const readFile = async (file: File | undefined) => {
    setFileError("");
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setFileError("Please upload a .csv file. In Excel use File › Save As › CSV (Comma delimited).");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File is larger than 2 MB. Split it into smaller files.");
      return;
    }

    const table = parseCsv(await file.text());
    if (table.length < 2) {
      setFileError("The file has no data rows. The first row must contain column names.");
      return;
    }
    const [headers, ...body] = table;
    if (body.length > MAX_ROWS) {
      setFileError(`Import up to ${MAX_ROWS} rows at a time (this file has ${body.length}).`);
      return;
    }
    const mapping = mapHeaders(headers, config.fields);
    const missingRequired = config.fields.filter((f) => f.required && !mapping.includes(f.key));
    if (missingRequired.length) {
      setFileError(`Missing required column(s): ${missingRequired.map((f) => f.label).join(", ")}. Download the template to see the expected columns.`);
      return;
    }

    let existing = new Set<string>();
    try {
      existing = (await config.loadExistingKeys?.()) ?? new Set();
    } catch {
      // Duplicate detection is best-effort; the import itself still validates on the server.
    }

    const preview = body.map((cells, index) => {
      const raw: ParsedRow = {};
      mapping.forEach((key, col) => {
        if (key) raw[key] = cells[col] ?? "";
      });
      const { row, errors } = validateRow(raw, config.fields);
      const uniqueValue = config.uniqueKey ? (row[config.uniqueKey] || "").trim().toLowerCase() : "";
      return { line: index + 2, row, errors, duplicate: Boolean(uniqueValue && existing.has(uniqueValue)) };
    });

    setUnmapped(headers.filter((_, i) => !mapping[i] && headers[i].trim()));
    setRows(preview);
    setFileName(file.name);
    setStage("preview");
  };

  const runImport = async () => {
    if (!counts.ready) return;
    const ok = await confirm({
      title: config.title,
      message: `Import ${counts.ready} ${config.entityLabel}? This adds new records and can't be undone in bulk.`,
      confirmLabel: "Import",
    });
    if (!ok) return;

    setStage("importing");
    setProgress(0);
    const next = rows.map((r) => ({ ...r }));
    let done = 0;
    for (const r of next) {
      if (r.errors.length) {
        r.status = "skipped";
        r.message = "Invalid row";
      } else if (skipDuplicates && r.duplicate) {
        r.status = "skipped";
        r.message = "Already exists";
      } else {
        try {
          await config.create(r.row);
          r.status = "imported";
        } catch (err) {
          r.status = "failed";
          r.message = getApiErrorMessage(err, "Failed");
        }
        done += 1;
        setProgress(done);
      }
    }
    setRows(next);
    setStage("done");
    const imported = next.filter((r) => r.status === "imported").length;
    showToast(`${imported} ${config.entityLabel} imported`, imported ? "success" : "error");
  };

  const shownFields = config.fields.filter((f) => rows.some((r) => r.row[f.key]));
  const statusBadge = (r: PreviewRow) => {
    if (r.status === "imported") return { text: "Imported", color: AppColors.greenText, bg: "#EAF6EA" };
    if (r.status === "failed") return { text: r.message || "Failed", color: AppColors.redText, bg: "#FDECEC" };
    if (r.errors.length) return { text: r.errors.join("; "), color: AppColors.redText, bg: "#FDECEC" };
    if (r.duplicate) return { text: skipDuplicates ? "Exists — will skip" : "Exists — will import again", color: "#8A6200", bg: "#FFF8E6" };
    return { text: r.status === "skipped" ? r.message || "Skipped" : "Ready", color: AppColors.primary, bg: "#EAF2EA" };
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title={config.title} subtitle={config.description} showBack />

      {stage === "select" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void readFile(e.dataTransfer.files?.[0]);
            }}
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white p-6 text-center transition-colors lg:col-span-2"
            style={{ borderColor: dragging ? AppColors.primary : fileError ? "#EF4444" : AppColors.lightGrey, backgroundColor: dragging ? "#F1F5F1" : "white" }}
          >
            <span className="material-icons text-5xl" style={{ color: AppColors.primary }} aria-hidden>upload_file</span>
            <span className="text-base font-semibold text-black">Click to choose a CSV file, or drag it here</span>
            <span className="text-xs" style={{ color: AppColors.grey }}>CSV up to 2 MB · max {MAX_ROWS} rows · first row must be column names</span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
            {fileError && <span className="max-w-lg text-sm text-red-500">{fileError}</span>}
          </label>

          <aside className="space-y-3 rounded-2xl border bg-white p-5" style={{ borderColor: AppColors.lightGrey }}>
            <h2 className="font-semibold text-black">Columns</h2>
            <ul className="space-y-1.5 text-sm">
              {config.fields.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-2">
                  <span className="text-black">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <span className="text-xs" style={{ color: AppColors.grey }}>
                    {f.type === "enum" ? f.options?.join(" / ") : f.type}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${button} w-full border`}
              style={{ borderColor: AppColors.lightGrey, color: AppColors.primary }}
              onClick={() => downloadCsv(`${config.kind}-import-template.csv`, templateCsv(config))}
            >
              <span className="material-icons text-[18px]" aria-hidden>download</span>
              Download template
            </button>
          </aside>
        </div>
      )}

      {stage !== "select" && (
        <div className="space-y-4 pb-10">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
            <span className="material-icons" style={{ color: AppColors.primary }} aria-hidden>description</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-black">{fileName}</span>
            <span className="text-sm" style={{ color: AppColors.grey }}>
              {rows.length} rows · {counts.invalid} invalid · {counts.duplicates} existing
            </span>
          </div>

          {unmapped.length > 0 && stage === "preview" && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#FFF8E6", color: "#8A6200" }}>
              Ignored columns (not recognised): {unmapped.join(", ")}
            </p>
          )}

          {stage === "importing" && (
            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }} aria-live="polite">
              <p className="mb-2 text-sm font-semibold text-black">Importing {progress} of {counts.ready}…</p>
              <div className="h-2 overflow-hidden rounded-full bg-[#ECEDEF]">
                <div className="h-full rounded-full transition-[width]" style={{ width: `${counts.ready ? (progress / counts.ready) * 100 : 0}%`, backgroundColor: AppColors.primary }} />
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Imported", value: counts.imported, color: AppColors.greenText },
                { label: "Failed", value: counts.failed, color: AppColors.redText },
                { label: "Skipped", value: rows.length - counts.imported - counts.failed, color: AppColors.grey },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
                  <p className="text-xs" style={{ color: AppColors.grey }}>{s.label}</p>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: AppColors.lightGrey }}>
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-[#F8F9FA]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: AppColors.grey }}>Row</th>
                    {shownFields.map((f) => (
                      <th key={f.key} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: AppColors.grey }}>{f.label}</th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: AppColors.grey }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const badge = statusBadge(r);
                    return (
                      <tr key={r.line} className="border-t" style={{ borderColor: "#F0F0F0" }}>
                        <td className="px-3 py-2 tabular-nums" style={{ color: AppColors.grey }}>{r.line}</td>
                        {shownFields.map((f) => (
                          <td key={f.key} className="max-w-[220px] truncate px-3 py-2">{r.row[f.key] || "—"}</td>
                        ))}
                        <td className="px-3 py-2">
                          <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: badge.color, backgroundColor: badge.bg }}>
                            {badge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {stage === "preview" && counts.duplicates > 0 ? (
              <label className="flex items-center gap-2 text-sm text-black">
                <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} className="h-4 w-4 accent-[#588157]" />
                Skip {counts.duplicates} {counts.duplicates === 1 ? "row" : "rows"} that already exist
              </label>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={reset} disabled={stage === "importing"} className={`${button} border bg-white`} style={{ borderColor: AppColors.lightGrey }}>
                {stage === "done" ? "Import another file" : "Choose a different file"}
              </button>
              {stage !== "done" && (
                <button
                  type="button"
                  onClick={() => void runImport()}
                  disabled={stage === "importing" || !counts.ready}
                  className={`${button} text-white`}
                  style={{ backgroundColor: AppColors.primary }}
                >
                  {stage === "importing" ? "Importing…" : `Import ${counts.ready} ${config.entityLabel}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {Toast}
    </div>
  );
}
