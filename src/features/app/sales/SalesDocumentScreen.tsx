"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { IconButton } from "@/components/ui/IconButton";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import { AppColors } from "@/constants/colors";
import {
  convertSalesDocument,
  deleteSalesDocument,
  getSalesDocuments,
  type SalesDocument,
} from "@/services/sales-api";
import { getApiErrorMessage } from "@/utils/api-error";
import { SalesDocumentModal } from "./SalesDocumentModal";
import { SALES_MODULES, type SalesModuleConfig } from "./sales-config";

function money(value: number | string | null | undefined) {
  const num = Number(value || 0);
  return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export function SalesDocumentScreen({ config }: { config: SalesModuleConfig }) {
  const router = useRouter();
  const { isDashboardShell } = useLayoutContext();
  const modal = useModal();
  const { showToast, Toast } = useToast();
  const [rows, setRows] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<SalesDocument | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSalesDocuments(config.docType, {
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load documents"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.docType, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => rows, [rows]);

  const openCreate = () => {
    setEditing(null);
    modal.openModal();
  };

  const openEdit = (doc: SalesDocument) => {
    setEditing(doc);
    modal.openModal();
  };

  const handleDelete = async (doc: SalesDocument) => {
    if (!confirm(`Delete ${doc.doc_no || `#${doc.id}`}?`)) return;
    try {
      await deleteSalesDocument(config.docType, doc.id);
      showToast("Deleted successfully");
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Delete failed"));
    }
  };

  const handleConvert = async (
    doc: SalesDocument,
    target: { label: string; target: import("@/services/sales-api").SalesDocType; route: string }
  ) => {
    if (!confirm(`${target.label} for ${doc.doc_no || `#${doc.id}`}?`)) return;
    try {
      await convertSalesDocument(config.docType, doc.id, target.target);
      showToast(`${target.label} ready`);
      router.push(target.route);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Convert failed"));
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <AppAppBar
        title={config.title}
        showNotification
        showBack={!isDashboardShell}
        showAvatar={!isDashboardShell}
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
      />

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-56">
          <AppDropDown
            title="Status"
            items={["all", ...config.statuses]}
            value={status}
            onChange={setStatus}
            getLabel={(v) => (v === "all" ? "All statuses" : v)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <AppTextField
            title="Search"
            hintText="Doc no / party / notes"
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {loading && <p className="text-sm" style={{ color: AppColors.grey }}>Loading...</p>}
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {!loading && !filtered.length && !error && (
        <div
          className="rounded-2xl border bg-white p-8 text-center"
          style={{ borderColor: AppColors.lightGrey }}
        >
          <p className="font-semibold text-black mb-1">No {config.title.toLowerCase()} yet</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>
            Tap + to create your first document
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
            style={{ borderColor: AppColors.lightGrey }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-black truncate">{doc.doc_no || `#${doc.id}`}</p>
                <p className="text-sm mt-0.5 truncate" style={{ color: AppColors.grey }}>
                  {doc.party_name || "No party"}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                style={{ backgroundColor: `${AppColors.primary}18`, color: AppColors.primary }}
              >
                {doc.payment_status || doc.status || "-"}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span style={{ color: AppColors.grey }}>{formatDate(doc.doc_date)}</span>
              <span className="font-semibold text-black">{money(doc.total_amount)}</span>
            </div>

            {doc.source_doc_id && (
              <p className="mt-2 text-xs" style={{ color: AppColors.grey }}>
                From {doc.source_doc_type} #{doc.source_doc_id}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-1 justify-end">
              {(config.convertTargets || []).map((target) => (
                <button
                  key={target.target}
                  type="button"
                  className="text-xs font-medium px-2 py-1 rounded-md hover:bg-black/5"
                  style={{ color: AppColors.primary }}
                  onClick={() => handleConvert(doc, target)}
                >
                  → {target.label.replace(/^Convert to /i, "")}
                </button>
              ))}
              <IconButton icon="edit" label="Edit" variant="edit" onClick={() => openEdit(doc)} />
              <IconButton
                icon="delete"
                label="Delete"
                variant="delete"
                onClick={() => handleDelete(doc)}
              />
            </div>
          </div>
        ))}
      </div>

      <FloatingActionButton onClick={openCreate} />
      <SalesDocumentModal
        open={modal.open}
        onClose={() => {
          modal.closeModal();
          setEditing(null);
        }}
        config={config}
        initial={editing}
        onSaved={() => {
          showToast(editing ? "Updated successfully" : "Saved successfully");
          load();
        }}
      />
      {Toast}
    </div>
  );
}

export function QuotationScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.quotation} />;
}
export function SaleOrderScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.sale_order} />;
}
export function SalesInvoiceScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.sales_invoice} />;
}
export function PaymentInScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.payment_in} />;
}
export function SalesReturnScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.sales_return} />;
}
export function DeliveryNoteScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.delivery_note} />;
}

/** Redirect add routes into list + modal via a thin wrapper that auto-opens create. */
export function SalesAddRedirectScreen({ config }: { config: SalesModuleConfig }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(config.route);
  }, [config.route, router]);
  return <SalesDocumentScreen config={config} />;
}
