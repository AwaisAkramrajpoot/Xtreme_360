"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { useModal } from "@/hooks/use-modal";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import {
  convertSalesDocument,
  createSalesDocument,
  deleteSalesDocument,
  getNextSalesDocNo,
  getSalesDocument,
  getSalesDocuments,
  type SalesDocType,
  type SalesDocument,
} from "@/services/sales-api";
import { useLoadingStore } from "@/stores/loading-store";
import { getApiErrorMessage } from "@/utils/api-error";
import { SalesDocumentModal } from "./SalesDocumentModal";
import { SALES_MODULES, type SalesModuleConfig } from "./sales-config";
import { buildPrintHtml } from "@/lib/print-document";
import { formatMoney } from "@/constants/app-settings";
import { useSettingsStore } from "@/stores/settings-store";
import { getParties } from "@/services/party-api";

function money(value: number | string | null | undefined) {
  return formatMoney(value, useSettingsStore.getState().app.general);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function printDocument(doc: SalesDocument, title: string, partyTin?: string | null) {
  const general = useSettingsStore.getState().app.general;
  const html = buildPrintHtml(doc, {
    title,
    partyTin,
    // General › Print amount on Delivery Note
    showAmounts: doc.doc_type !== "delivery_note" || general.printAmountOnNote,
  });

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}

/** Party TIN is only fetched when Invoice Print › "Party TIN on sale" is on. */
async function resolvePartyTin(doc: SalesDocument) {
  if (!useSettingsStore.getState().app.invoicePrint.tinOnSale || !doc.party_id) return null;
  try {
    const parties = await getParties();
    return parties.find((p) => p.id === doc.party_id)?.tin_number || null;
  } catch {
    return null;
  }
}

type MenuKind = "convert" | "more" | null;

function ActionIcon({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
      style={{ color: AppColors.greyishBlack }}
    >
      <span className="material-icons" style={{ fontSize: 20 }}>
        {icon}
      </span>
    </button>
  );
}

function PopupMenu({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 z-40 min-w-[200px] rounded-xl border bg-white py-2 shadow-xl"
      style={{ borderColor: AppColors.lightGrey }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b" style={{ borderColor: AppColors.lightGrey }}>
        <span className="text-sm font-semibold text-black">{title}</span>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-black/5" aria-label="Close">
          <span className="material-icons text-base">close</span>
        </button>
      </div>
      <div className="py-1">{children}</div>
    </div>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-black/5"
      style={{ color: danger ? AppColors.redText : AppColors.black }}
    >
      {icon && (
        <span className="material-icons" style={{ fontSize: 18 }}>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

function SalesDocCard({
  doc,
  config,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onConvert,
  onPrint,
  onShare,
  onDuplicate,
  onMakePayment,
  onReturn,
}: {
  doc: SalesDocument;
  config: SalesModuleConfig;
  menuOpen: MenuKind;
  onToggleMenu: (kind: MenuKind) => void;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: (target: { label: string; target: SalesDocType; route: string }) => void;
  onPrint: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onMakePayment: () => void;
  onReturn: () => void;
}) {
  const convertTargets = config.convertTargets || [];
  const statusLabel = (doc.payment_status || doc.status || "open").toString();

  return (
    <div
      className="relative rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
      style={{ borderColor: AppColors.lightGrey }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize text-white"
          style={{ backgroundColor: AppColors.primary }}
        >
          {statusLabel}
        </span>
        {convertTargets.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu(menuOpen === "convert" ? null : "convert")}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "#E8F1FF", color: "#2F6FED" }}
            >
              Convert
            </button>
            <PopupMenu open={menuOpen === "convert"} onClose={() => onToggleMenu(null)} title="Select">
              {convertTargets.map((target) => (
                <MenuItem
                  key={target.target}
                  label={target.label.replace(/^Convert to /i, "")}
                  icon="sync_alt"
                  onClick={() => onConvert(target)}
                />
              ))}
            </PopupMenu>
          </div>
        )}
      </div>

      <p className="text-xl font-bold text-black">{money(doc.total_amount)}</p>
      <p className="mt-1 text-sm font-semibold text-black truncate">{doc.doc_no || `#${doc.id}`}</p>
      <p className="text-sm truncate" style={{ color: AppColors.grey }}>
        {doc.party_name || "No party"} · {formatDate(doc.doc_date)}
      </p>

      <div className="mt-4 flex items-center gap-1 border-t pt-3" style={{ borderColor: AppColors.lightGrey }}>
        <ActionIcon icon="print" label="Print" onClick={onPrint} />
        <ActionIcon icon="ios_share" label="Share" onClick={onShare} />
        <div className="relative">
          <ActionIcon
            icon="more_vert"
            label="More options"
            onClick={() => onToggleMenu(menuOpen === "more" ? null : "more")}
          />
          <PopupMenu open={menuOpen === "more"} onClose={() => onToggleMenu(null)} title="Options">
            <MenuItem label="Edit" icon="edit" onClick={onEdit} />
            <MenuItem label="Duplicate" icon="content_copy" onClick={onDuplicate} />
            {config.paymentRoute && (
              <MenuItem label="Make Payment" icon="payments" onClick={onMakePayment} />
            )}
            {config.returnRoute && <MenuItem label="Return" icon="undo" onClick={onReturn} />}
            <MenuItem label="Share as PDF" icon="picture_as_pdf" onClick={onShare} />
            <MenuItem label="Delete" icon="delete" onClick={onDelete} danger />
          </PopupMenu>
        </div>
      </div>
    </div>
  );
}

export function SalesDocumentScreen({ config }: { config: SalesModuleConfig }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const showLoading = useLoadingStore((s) => s.show);
  const hideLoading = useLoadingStore((s) => s.hide);
  const modal = useModal();
  const { showToast, Toast } = useToast();
  const [rows, setRows] = useState<SalesDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<SalesDocument | null>(null);
  const [openMenus, setOpenMenus] = useState<Record<number, MenuKind>>({});

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
    setOpenMenus({});
    setEditing(doc);
    modal.openModal();
  };

  const resolveDoc = async (doc: SalesDocument) => {
    if (doc.items?.length) return doc;
    try {
      return (await getSalesDocument(config.docType, doc.id)) || doc;
    } catch {
      return doc;
    }
  };

  const handleDelete = async (doc: SalesDocument) => {
    setOpenMenus({});
    const ok = await confirm({
      title: "Delete document",
      message: `Delete ${doc.doc_no || `#${doc.id}`}? You can restore it from Utilities › Recycle Bin for 30 days.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    showLoading("Deleting...");
    try {
      await deleteSalesDocument(config.docType, doc.id);
      showToast("Deleted successfully");
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Delete failed"));
    } finally {
      hideLoading();
    }
  };

  const handleConvert = async (
    doc: SalesDocument,
    target: { label: string; target: SalesDocType; route: string }
  ) => {
    setOpenMenus({});
    const ok = await confirm({
      title: target.label,
      message: `${target.label} for ${doc.doc_no || `#${doc.id}`}?`,
      confirmLabel: "Continue",
    });
    if (!ok) return;
    showLoading("Processing...");
    try {
      await convertSalesDocument(config.docType, doc.id, target.target);
      showToast(`${target.label} ready`);
      router.push(target.route);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Convert failed"));
    } finally {
      hideLoading();
    }
  };

  const handlePrint = async (doc: SalesDocument) => {
    setOpenMenus({});
    try {
      const full = await resolveDoc(doc);
      const ok = printDocument(full, config.title, await resolvePartyTin(full));
      if (!ok) showToast("Please allow popups to print");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Print failed"));
    }
  };

  const handleShare = async (doc: SalesDocument) => {
    setOpenMenus({});
    try {
      const full = await resolveDoc(doc);
      const text = `${config.title} ${full.doc_no || `#${full.id}`} — ${full.party_name || "Party"} — ${money(full.total_amount)}`;
      if (navigator.share) {
        await navigator.share({ title: config.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("Details copied. Use Print → Save as PDF to share PDF");
      printDocument(full, config.title);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      showToast(getApiErrorMessage(err, "Share failed"));
    }
  };

  const handleDuplicate = async (doc: SalesDocument) => {
    setOpenMenus({});
    try {
      const full = await resolveDoc(doc);
      const nextNo = await getNextSalesDocNo(config.docType);
      await createSalesDocument(config.docType, {
        docNo: nextNo,
        partyId: full.party_id,
        partyName: full.party_name || undefined,
        docDate: new Date().toLocaleDateString("en-CA"),
        dueDate: full.due_date ? String(full.due_date).slice(0, 10) : undefined,
        status: config.statuses[0],
        notes: full.notes || undefined,
        terms: full.terms || undefined,
        deliveryAddress: full.delivery_address || undefined,
        transporter: full.transporter || undefined,
        vehicleNo: full.vehicle_no || undefined,
        totalAmount: config.showItems ? undefined : Number(full.total_amount || 0),
        items: (full.items || []).map((item) => ({
          itemId: item.item_id ?? null,
          itemName: item.item_name,
          itemCode: item.item_code || undefined,
          unit: item.unit || undefined,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          discount: Number(item.discount) || 0,
          taxPercent: Number(item.tax_percent) || 0,
          reason: item.reason || undefined,
          orderedQty: item.ordered_qty != null ? Number(item.ordered_qty) : undefined,
        })),
      });
      showToast("Duplicated successfully");
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Duplicate failed"));
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <AppAppBar
        title={config.title}
        showNotification
        showBack
        showAvatar
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

      {loading && (
        <p className="text-sm" style={{ color: AppColors.grey }}>
          Loading...
        </p>
      )}
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
          <SalesDocCard
            key={doc.id}
            doc={doc}
            config={config}
            menuOpen={openMenus[doc.id] || null}
            onToggleMenu={(kind) => setOpenMenus(kind ? { [doc.id]: kind } : {})}
            onEdit={() => openEdit(doc)}
            onDelete={() => handleDelete(doc)}
            onConvert={(target) => handleConvert(doc, target)}
            onPrint={() => handlePrint(doc)}
            onShare={() => handleShare(doc)}
            onDuplicate={() => handleDuplicate(doc)}
            onMakePayment={() => {
              setOpenMenus({});
              if (config.paymentRoute) router.push(config.paymentRoute);
            }}
            onReturn={() => {
              setOpenMenus({});
              if (config.returnRoute) router.push(config.returnRoute);
            }}
          />
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
export function PurchaseOrderScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.purchase_order} />;
}
export function PurchaseBillScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.purchase_bill} />;
}
export function PaymentOutScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.payment_out} />;
}
export function PurchaseReturnScreen() {
  return <SalesDocumentScreen config={SALES_MODULES.purchase_return} />;
}

export function SalesAddRedirectScreen({ config }: { config: SalesModuleConfig }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(config.route);
  }, [config.route, router]);
  return <SalesDocumentScreen config={config} />;
}
