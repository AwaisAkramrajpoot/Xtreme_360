"use client";

import { useEffect, useMemo, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { getApiErrorMessage } from "@/utils/api-error";
import { deletePosTable, getPosTables, savePosTable, type PosTable } from "@/services/pos-api";
import { ORDER_STATUS, TABLE_STATUS, elapsed } from "./pos-shared";
import { PosButton, PosEmpty, PosField, PosPill, posInput } from "./pos-ui";

type Props = {
  tables: PosTable[];
  loading: boolean;
  error: string | null;
  canManage: boolean;
  money: (v: number) => string;
  onReload: () => void;
  /** A table was tapped; the terminal decides what to do from its status. */
  onPick: (table: PosTable) => void;
  notify: (message: string, type?: "success" | "error") => void;
};

export function TablesPanel({ tables, loading, error, canManage, money, onReload, onPick, notify }: Props) {
  const [area, setArea] = useState("All");
  const [filter, setFilter] = useState<"all" | PosTable["status"]>("all");
  const [managing, setManaging] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Keep "seated for 25 min" fresh.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const areas = useMemo(() => ["All", ...Array.from(new Set(tables.map((t) => t.area || "Main"))).sort()], [tables]);
  const counts = useMemo(
    () => ({
      free: tables.filter((t) => t.status === "free").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    }),
    [tables]
  );
  const visible = tables.filter((t) => (area === "All" || (t.area || "Main") === area) && (filter === "all" || t.status === filter));
  const grouped = useMemo(() => {
    const map = new Map<string, PosTable[]>();
    for (const t of visible) map.set(t.area || "Main", [...(map.get(t.area || "Main") || []), t]);
    return Array.from(map.entries());
  }, [visible]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "free", "occupied", "reserved"] as const).map((key) => {
          const active = filter === key;
          const meta = key === "all" ? null : TABLE_STATUS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className="inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors"
              style={{
                borderColor: active ? meta?.color || AppColors.primary : AppColors.lightGrey,
                backgroundColor: active ? meta?.bg || "#EAF2EA" : "#fff",
                color: active ? meta?.color || AppColors.primary : "#374151",
              }}
            >
              {meta && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.dot }} aria-hidden />}
              {key === "all" ? `All tables · ${tables.length}` : `${meta!.label} · ${counts[key]}`}
            </button>
          );
        })}
        <div className="ml-auto flex gap-2">
          <PosButton icon="refresh" onClick={onReload} loading={loading && tables.length > 0}>Refresh</PosButton>
          {canManage && <PosButton icon="table_restaurant" onClick={() => setManaging(true)}>Manage tables</PosButton>}
        </div>
      </div>

      {areas.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium"
              style={{ borderColor: area === a ? AppColors.primary : AppColors.lightGrey, color: area === a ? AppColors.primary : "#374151", backgroundColor: area === a ? "#EAF2EA" : "#fff" }}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <PosEmpty icon="error_outline" title={error} action={<PosButton icon="refresh" onClick={onReload}>Try again</PosButton>} />
      ) : loading && !tables.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : !tables.length ? (
        <PosEmpty
          icon="table_restaurant"
          title="No tables set up yet"
          hint={canManage ? "Add your dining tables to take dine-in orders and reservations." : "Ask a manager to add the dining tables."}
          action={canManage ? <PosButton variant="primary" icon="add" onClick={() => setManaging(true)}>Add tables</PosButton> : undefined}
        />
      ) : !visible.length ? (
        <PosEmpty icon="filter_alt_off" title="No tables match this filter" />
      ) : (
        grouped.map(([areaName, list]) => (
          <div key={areaName}>
            {grouped.length > 1 || areas.length > 2 ? (
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: AppColors.grey }}>{areaName}</h3>
            ) : null}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {list.map((t) => {
                const meta = TABLE_STATUS[t.status];
                const kitchen = t.order_status ? ORDER_STATUS[t.order_status] : null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onPick(t)}
                    className="group flex min-h-36 flex-col rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: meta.bg, borderColor: meta.border }}
                    aria-label={`Table ${t.name}, ${meta.label}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl font-extrabold leading-none text-black">{t.name}</span>
                      <PosPill bg="#fff" color={meta.color}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.dot }} aria-hidden />
                        {meta.label}
                      </PosPill>
                    </div>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: AppColors.grey }}>
                      <span aria-hidden className="material-icons text-[14px]">chair</span>
                      {t.capacity} seats
                    </span>

                    <div className="mt-auto pt-2 text-xs">
                      {t.status === "occupied" && t.order_id && (
                        <>
                          <p className="text-base font-bold tabular-nums text-black">{money(Number(t.order_total || 0))}</p>
                          <p style={{ color: AppColors.grey }}>
                            {t.order_no} · {elapsed(t.order_opened_at, now)}
                            {t.order_guests ? ` · ${t.order_guests} guests` : ""}
                          </p>
                          {kitchen && <span className="mt-1 inline-block"><PosPill bg={kitchen.bg} color={kitchen.color} icon={kitchen.icon}>{kitchen.label}</PosPill></span>}
                        </>
                      )}
                      {t.status === "occupied" && !t.order_id && (
                        <p className="font-semibold" style={{ color: meta.color }}>Seated: {t.seated_customer} · tap to order</p>
                      )}
                      {t.status === "reserved" && (
                        <p className="font-semibold" style={{ color: meta.color }}>
                          {t.reservation_customer} · {t.reservation_time}
                          {t.reservation_guests ? ` · ${t.reservation_guests} guests` : ""}
                        </p>
                      )}
                      {t.status === "free" && (
                        <p style={{ color: AppColors.grey }}>
                          {t.reservation_time ? `Booked at ${t.reservation_time} · ` : ""}
                          <span className="font-semibold" style={{ color: meta.color }}>Tap to start order</span>
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

      {managing && (
        <ManageTablesModal
          onClose={() => setManaging(false)}
          onChanged={onReload}
          notify={notify}
        />
      )}
    </section>
  );
}

/* ---------------- floor plan editor ---------------- */

type Draft = { name: string; area: string; capacity: string };
const emptyDraft: Draft = { name: "", area: "", capacity: "4" };

function ManageTablesModal({ onClose, onChanged, notify }: { onClose: () => void; onChanged: () => void; notify: Props["notify"] }) {
  const { confirm } = useConfirm();
  const [list, setList] = useState<PosTable[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [bulk, setBulk] = useState({ prefix: "T", from: "1", count: "10", area: "", capacity: "4" });
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    try {
      setList(await getPosTables({ all: true }));
      setLoadError("");
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Failed to load tables"));
    }
  };
  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const areas = Array.from(new Set((list || []).map((t) => t.area).filter(Boolean) as string[]));

  const save = async () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Enter a table name";
    const cap = Number(draft.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 50) next.capacity = "1 to 50";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await savePosTable(editingId, { name: draft.name.trim(), area: draft.area.trim(), capacity: cap });
      notify(editingId ? "Table updated" : `Table ${draft.name.trim()} added`);
      setDraft({ ...emptyDraft, area: draft.area });
      setEditingId(null);
      await load();
      onChanged();
    } catch (err) {
      setErrors({ name: getApiErrorMessage(err, "Failed to save table") });
    } finally {
      setSaving(false);
    }
  };

  const addMany = async () => {
    const from = Number(bulk.from);
    const count = Number(bulk.count);
    const cap = Number(bulk.capacity);
    if (!Number.isInteger(from) || !Number.isInteger(count) || count < 1 || count > 50 || !Number.isInteger(cap) || cap < 1) {
      notify("Check the numbers: up to 50 tables at once", "error");
      return;
    }
    setBulkBusy(true);
    let added = 0;
    const skipped: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const name = `${bulk.prefix.trim()}${from + i}`;
      try {
        await savePosTable(null, { name, area: bulk.area.trim(), capacity: cap });
        added += 1;
      } catch {
        skipped.push(name);
      }
    }
    setBulkBusy(false);
    notify(`${added} table${added === 1 ? "" : "s"} added${skipped.length ? ` · skipped existing ${skipped.join(", ")}` : ""}`);
    await load();
    onChanged();
  };

  const toggleActive = async (t: PosTable) => {
    try {
      await savePosTable(t.id, { is_active: !t.is_active });
      await load();
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to update table"), "error");
    }
  };

  const remove = async (t: PosTable) => {
    const ok = await confirm({ title: "Delete table", message: `Delete table ${t.name}? Past bills keep their history.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deletePosTable(t.id);
      notify(`Table ${t.name} deleted`);
      await load();
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to delete table"), "error");
    }
  };

  return (
    <AppModal open onClose={onClose} title="Manage Tables" titleIcon="table_restaurant" size="xl">
      <div className="space-y-5">
        <div className="rounded-xl border p-3" style={{ borderColor: AppColors.lightGrey }}>
          <p className="mb-2 text-sm font-semibold text-black">{editingId ? "Edit table" : "Add a table"}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-end">
            <PosField label="Table name" required error={errors.name}>
              <input className={posInput} style={{ borderColor: AppColors.lightGrey }} value={draft.name} placeholder="e.g. T1, Window 2" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </PosField>
            <PosField label="Area / section">
              <input className={posInput} style={{ borderColor: AppColors.lightGrey }} value={draft.area} list="pos-areas" placeholder="e.g. Main Hall, Terrace" onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            </PosField>
            <PosField label="Seats" required error={errors.capacity}>
              <input type="number" min={1} max={50} className={posInput} style={{ borderColor: AppColors.lightGrey }} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
            </PosField>
            <div className="flex gap-2">
              {editingId && <PosButton onClick={() => { setEditingId(null); setDraft(emptyDraft); setErrors({}); }}>Cancel</PosButton>}
              <PosButton variant="primary" icon={editingId ? "save" : "add"} onClick={() => void save()} loading={saving}>{editingId ? "Save" : "Add"}</PosButton>
            </div>
          </div>
          <datalist id="pos-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist>
        </div>

        {!editingId && (
          <details className="rounded-xl border p-3" style={{ borderColor: AppColors.lightGrey }}>
            <summary className="cursor-pointer text-sm font-semibold text-black">Add many tables at once</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
              <PosField label="Name prefix"><input className={posInput} style={{ borderColor: AppColors.lightGrey }} value={bulk.prefix} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value })} /></PosField>
              <PosField label="Start at"><input type="number" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={bulk.from} onChange={(e) => setBulk({ ...bulk, from: e.target.value })} /></PosField>
              <PosField label="How many"><input type="number" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={bulk.count} onChange={(e) => setBulk({ ...bulk, count: e.target.value })} /></PosField>
              <PosField label="Seats each"><input type="number" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={bulk.capacity} onChange={(e) => setBulk({ ...bulk, capacity: e.target.value })} /></PosField>
              <PosField label="Area"><input className={posInput} list="pos-areas" style={{ borderColor: AppColors.lightGrey }} value={bulk.area} onChange={(e) => setBulk({ ...bulk, area: e.target.value })} /></PosField>
            </div>
            <PosButton className="mt-3" variant="primary" icon="playlist_add" loading={bulkBusy} onClick={() => void addMany()}>
              Add {bulk.prefix}{bulk.from}…{bulk.prefix}{Number(bulk.from) + Math.max(Number(bulk.count) - 1, 0)}
            </PosButton>
          </details>
        )}

        {loadError ? (
          <p className="text-sm text-red-500">{loadError}</p>
        ) : !list ? (
          <div className="h-32 animate-pulse rounded-xl bg-gray-50" />
        ) : !list.length ? (
          <p className="py-6 text-center text-sm" style={{ color: AppColors.grey }}>No tables yet. Add your first one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase" style={{ color: AppColors.grey }}>
                  <th className="py-2">Table</th><th>Area</th><th>Seats</th><th>Status</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-t" style={{ borderColor: AppColors.lightGrey, opacity: t.is_active ? 1 : 0.55 }}>
                    <td className="py-2 font-semibold text-black">{t.name}</td>
                    <td>{t.area || "—"}</td>
                    <td>{t.capacity}</td>
                    <td>{t.is_active ? TABLE_STATUS[t.status].label : "Hidden"}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        <PosButton variant="ghost" icon="edit" title={`Edit ${t.name}`} onClick={() => { setEditingId(t.id); setDraft({ name: t.name, area: t.area || "", capacity: String(t.capacity) }); setErrors({}); }} />
                        <PosButton variant="ghost" icon={t.is_active ? "visibility_off" : "visibility"} title={t.is_active ? "Hide from the floor" : "Show on the floor"} onClick={() => void toggleActive(t)} />
                        <PosButton variant="ghost" icon="delete" title={`Delete ${t.name}`} className="!text-red-600" onClick={() => void remove(t)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppModal>
  );
}
