"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppModal } from "@/components/ui/AppModal";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { getApiErrorMessage } from "@/utils/api-error";
import type { PartyRecord } from "@/services/party-api";
import {
  deletePosReservation,
  getPosReservations,
  localClock,
  savePosReservation,
  setPosReservationStatus,
  type PosReservation,
  type PosReservationStatus,
  type PosTable,
} from "@/services/pos-api";
import { RESERVATION_STATUS, TABLE_STATUS, formatBillDate } from "./pos-shared";
import { PosButton, PosEmpty, PosField, PosPill, posInput } from "./pos-ui";

type Props = {
  tables: PosTable[];
  parties: PartyRecord[];
  /** Guests have been seated at `table`: open an order for them. */
  onSeated: (reservation: PosReservation) => void;
  /** Reservations changed: table statuses need a refresh. */
  onChanged: () => void;
  notify: (message: string, type?: "success" | "error") => void;
};

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return localClock(d).date;
};

export function ReservationsPanel({ tables, parties, onSeated, onChanged, notify }: Props) {
  const { confirm } = useConfirm();
  const [date, setDate] = useState(() => localClock().date);
  const [scope, setScope] = useState<"active" | "all">("active");
  const [list, setList] = useState<PosReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PosReservation | null | undefined>(undefined);
  const [seating, setSeating] = useState<PosReservation | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await getPosReservations({ date, ...(scope === "active" ? { status: "booked,seated" } : {}) }));
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load reservations"));
    } finally {
      setLoading(false);
    }
  }, [date, scope]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const counts = useMemo(
    () => ({
      guests: list.filter((r) => ["booked", "seated"].includes(r.status)).reduce((s, r) => s + r.guests, 0),
      booked: list.filter((r) => r.status === "booked").length,
    }),
    [list]
  );

  const move = async (r: PosReservation, status: PosReservationStatus, tableId?: number | null) => {
    setBusyId(r.id);
    try {
      const updated = await setPosReservationStatus(r.id, status, tableId);
      notify(
        { seated: `${r.customer_name} seated`, completed: "Reservation completed", cancelled: "Reservation cancelled", no_show: "Marked as no-show", booked: "Reservation reopened" }[status]
      );
      await load();
      onChanged();
      if (status === "seated" && updated) onSeated(updated);
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to update reservation"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const arrive = (r: PosReservation) => {
    const table = tables.find((t) => t.id === r.table_id);
    // Booked table is free (or only reserved for this booking): seat straight away.
    if (table && (table.status !== "occupied" || table.seated_reservation_id === r.id)) void move(r, "seated");
    else setSeating(r);
  };

  const cancel = async (r: PosReservation, status: "cancelled" | "no_show") => {
    const ok = await confirm({
      title: status === "cancelled" ? "Cancel reservation" : "Mark as no-show",
      message: `${r.customer_name} · ${formatBillDate(r.reservation_date)} ${r.reservation_time} · ${r.guests} guests`,
      confirmLabel: status === "cancelled" ? "Cancel reservation" : "No-show",
      danger: true,
    });
    if (ok) await move(r, status);
  };

  const remove = async (r: PosReservation) => {
    const ok = await confirm({ title: "Delete reservation", message: `Delete ${r.customer_name}'s reservation permanently?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deletePosReservation(r.id);
      notify("Reservation deleted");
      await load();
      onChanged();
    } catch (err) {
      notify(getApiErrorMessage(err, "Failed to delete reservation"), "error");
    }
  };

  const today = localClock().date;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border bg-white p-1" style={{ borderColor: AppColors.lightGrey }}>
          <button type="button" aria-label="Previous day" onClick={() => setDate(shiftDate(date, -1))} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
            <span aria-hidden className="material-icons text-[20px]">chevron_left</span>
          </button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Reservation date" className="h-8 rounded-md px-2 text-sm outline-none" />
          <button type="button" aria-label="Next day" onClick={() => setDate(shiftDate(date, 1))} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
            <span aria-hidden className="material-icons text-[20px]">chevron_right</span>
          </button>
        </div>
        {date !== today && <PosButton variant="ghost" onClick={() => setDate(today)}>Today</PosButton>}
        <select value={scope} onChange={(e) => setScope(e.target.value as "active" | "all")} aria-label="Show" className="h-10 rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#588157]" style={{ borderColor: AppColors.lightGrey }}>
          <option value="active">Upcoming &amp; seated</option>
          <option value="all">All statuses</option>
        </select>
        <span className="text-sm" style={{ color: AppColors.grey }}>
          {counts.booked} booked · {counts.guests} guests expected
        </span>
        <PosButton className="ml-auto" variant="primary" icon="event_available" onClick={() => setEditing(null)}>
          New reservation
        </PosButton>
      </div>

      {error ? (
        <PosEmpty icon="error_outline" title={error} action={<PosButton icon="refresh" onClick={() => void load()}>Try again</PosButton>} />
      ) : loading && !list.length ? (
        <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />)}</div>
      ) : !list.length ? (
        <PosEmpty
          icon="event_seat"
          title={`No ${scope === "active" ? "upcoming " : ""}reservations on ${formatBillDate(date)}`}
          hint="Book a table for a customer with a date, time and number of guests."
          action={<PosButton variant="primary" icon="add" onClick={() => setEditing(null)}>New reservation</PosButton>}
        />
      ) : (
        <div className="space-y-2">
          {list.map((r) => {
            const meta = RESERVATION_STATUS[r.status];
            const busy = busyId === r.id;
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row sm:items-center" style={{ borderColor: AppColors.lightGrey }}>
                <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg py-2" style={{ backgroundColor: meta.bg }}>
                  <span className="text-lg font-extrabold tabular-nums" style={{ color: meta.color }}>{r.reservation_time}</span>
                  <span className="text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-black">{r.customer_name}</p>
                  <p className="text-xs" style={{ color: AppColors.grey }}>
                    <span className="inline-flex items-center gap-1"><span aria-hidden className="material-icons text-[14px]">group</span>{r.guests} guests</span>
                    {" · "}
                    {r.table_name ? `Table ${r.table_name}${r.table_area ? ` (${r.table_area})` : ""}` : <span className="font-semibold text-amber-700">No table assigned</span>}
                    {r.customer_phone ? ` · ${r.customer_phone}` : ""}
                  </p>
                  {r.notes && <p className="mt-0.5 truncate text-xs italic" style={{ color: AppColors.grey }}>“{r.notes}”</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.status === "booked" && (
                    <>
                      <PosButton variant="primary" icon="how_to_reg" loading={busy} onClick={() => arrive(r)}>Arrived · Seat</PosButton>
                      <PosButton icon="edit" title="Edit" onClick={() => setEditing(r)} />
                      <PosButton variant="danger" icon="person_off" title="No-show" onClick={() => void cancel(r, "no_show")} />
                      <PosButton variant="danger" icon="event_busy" title="Cancel reservation" onClick={() => void cancel(r, "cancelled")} />
                    </>
                  )}
                  {r.status === "seated" && (
                    <>
                      <PosButton variant="primary" icon={r.order_id ? "receipt_long" : "add_shopping_cart"} onClick={() => onSeated(r)}>
                        {r.order_id ? "Open order" : "Take order"}
                      </PosButton>
                      <PosButton icon="task_alt" loading={busy} onClick={() => void move(r, "completed")}>Complete</PosButton>
                    </>
                  )}
                  {(r.status === "cancelled" || r.status === "no_show") && (
                    <>
                      <PosButton icon="restore" loading={busy} onClick={() => void move(r, "booked")}>Reopen</PosButton>
                      <PosButton variant="danger" icon="delete" title="Delete" onClick={() => void remove(r)} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <ReservationModal
          reservation={editing}
          defaultDate={date}
          tables={tables}
          parties={parties}
          onClose={() => setEditing(undefined)}
          onSaved={async (saved, isNew) => {
            notify(isNew ? `Table booked for ${saved.customer_name}` : "Reservation updated");
            setEditing(undefined);
            if (saved.reservation_date !== date) setDate(saved.reservation_date);
            else await load();
            onChanged();
          }}
        />
      )}
      {seating && (
        <SeatModal
          reservation={seating}
          tables={tables}
          onClose={() => setSeating(null)}
          onSeat={(tableId) => {
            const r = seating;
            setSeating(null);
            void move(r, "seated", tableId);
          }}
        />
      )}
    </section>
  );
}

/* ---------------- booking form ---------------- */

function ReservationModal({
  reservation,
  defaultDate,
  tables,
  parties,
  onClose,
  onSaved,
}: {
  reservation: PosReservation | null;
  defaultDate: string;
  tables: PosTable[];
  parties: PartyRecord[];
  onClose: () => void;
  onSaved: (saved: PosReservation, isNew: boolean) => void;
}) {
  const [form, setForm] = useState(() => {
    // New bookings for today default to the next full hour.
    const nextHour = localClock(new Date(Date.now() + 60 * 60000)).time.slice(0, 2);
    return {
      party_id: reservation?.party_id ? String(reservation.party_id) : "",
      customer_name: reservation?.customer_name ?? "",
      customer_phone: reservation?.customer_phone ?? "",
      reservation_date: reservation?.reservation_date ?? defaultDate,
      reservation_time: reservation?.reservation_time ?? (defaultDate === localClock().date ? `${nextHour}:00` : "19:00"),
      guests: String(reservation?.guests ?? 2),
      table_id: reservation?.table_id ? String(reservation.table_id) : "",
      notes: reservation?.notes ?? "",
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const guests = Number(form.guests) || 0;

  const pickParty = (id: string) => {
    const p = parties.find((x) => String(x.id) === id);
    setForm((f) => ({ ...f, party_id: id, customer_name: p ? p.party_name : f.customer_name, customer_phone: p?.mobile_number || f.customer_phone }));
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.customer_name.trim()) next.customer_name = "Enter the customer's name";
    if (!form.reservation_date) next.reservation_date = "Choose a date";
    if (!form.reservation_time) next.reservation_time = "Choose a time";
    if (!Number.isInteger(guests) || guests < 1) next.guests = "At least 1 guest";
    if (!reservation && form.reservation_date && form.reservation_time) {
      const when = new Date(`${form.reservation_date}T${form.reservation_time}`);
      if (when.getTime() < Date.now() - 15 * 60000) next.reservation_time = "This time has already passed";
    }
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const saved = await savePosReservation(reservation?.id ?? null, {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        reservation_date: form.reservation_date,
        reservation_time: form.reservation_time,
        guests,
        table_id: Number(form.table_id) || null,
        party_id: Number(form.party_id) || null,
        notes: form.notes.trim(),
      });
      if (saved) onSaved(saved, !reservation);
    } catch (err) {
      const fieldErrors = (err as { response?: { data?: { data?: { errors?: Record<string, string> } } } })?.response?.data?.data?.errors;
      if (fieldErrors) setErrors(fieldErrors);
      setSubmitError(getApiErrorMessage(err, "Failed to save reservation"));
    } finally {
      setSaving(false);
    }
  };

  const activeTables = tables.filter((t) => t.is_active);

  return (
    <AppModal
      open
      onClose={onClose}
      title={reservation ? "Edit Reservation" : "New Reservation"}
      titleIcon="event_available"
      size="lg"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <PosButton onClick={onClose}>Cancel</PosButton>
          <PosButton variant="primary" icon="check" loading={saving} onClick={() => void save()}>{reservation ? "Save changes" : "Book table"}</PosButton>
        </div>
      }
    >
      <div className="space-y-4">
        {submitError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{submitError}</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PosField label="Existing customer (optional)">
            <select className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.party_id} onChange={(e) => pickParty(e.target.value)}>
              <option value="">New / walk-in customer</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.party_name}{p.mobile_number ? ` · ${p.mobile_number}` : ""}</option>
              ))}
            </select>
          </PosField>
          <PosField label="Customer name" required error={errors.customer_name}>
            <input className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.customer_name} onChange={(e) => set("customer_name")(e.target.value)} placeholder="Full name" />
          </PosField>
          <PosField label="Phone" error={errors.customer_phone}>
            <input type="tel" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.customer_phone} onChange={(e) => set("customer_phone")(e.target.value)} placeholder="03xx xxxxxxx" />
          </PosField>
          <PosField label="Guests" required error={errors.guests}>
            <input type="number" min={1} max={200} className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.guests} onChange={(e) => set("guests")(e.target.value)} />
          </PosField>
          <PosField label="Date" required error={errors.reservation_date}>
            <input type="date" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.reservation_date} onChange={(e) => set("reservation_date")(e.target.value)} />
          </PosField>
          <PosField label="Time" required error={errors.reservation_time}>
            <input type="time" className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.reservation_time} onChange={(e) => set("reservation_time")(e.target.value)} />
          </PosField>
        </div>
        <PosField label="Table" error={errors.table_id}>
          <select className={posInput} style={{ borderColor: AppColors.lightGrey }} value={form.table_id} onChange={(e) => set("table_id")(e.target.value)}>
            <option value="">Assign when the guests arrive</option>
            {activeTables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.area ? ` · ${t.area}` : ""} · {t.capacity} seats{guests > t.capacity ? " (too small)" : ""}
              </option>
            ))}
          </select>
        </PosField>
        {Number(form.table_id) > 0 && guests > (activeTables.find((t) => String(t.id) === form.table_id)?.capacity ?? 99) && (
          <p className="-mt-2 text-xs text-amber-700">This table seats fewer people than the party size.</p>
        )}
        <PosField label="Notes">
          <textarea rows={2} className={`${posInput} h-auto py-2`} style={{ borderColor: AppColors.lightGrey }} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Birthday, high chair, window seat…" />
        </PosField>
      </div>
    </AppModal>
  );
}

/* ---------------- seat at a table ---------------- */

function SeatModal({ reservation, tables, onClose, onSeat }: { reservation: PosReservation; tables: PosTable[]; onClose: () => void; onSeat: (tableId: number) => void }) {
  const options = tables.filter((t) => t.is_active && t.status !== "occupied");
  return (
    <AppModal open onClose={onClose} title={`Seat ${reservation.customer_name}`} titleIcon="event_seat" size="md">
      <p className="mb-3 text-sm" style={{ color: AppColors.grey }}>
        {reservation.guests} guests. {reservation.table_name ? `Table ${reservation.table_name} is busy — ` : ""}choose a free table:
      </p>
      {!options.length ? (
        <p className="py-6 text-center text-sm text-red-600">No free tables right now.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {options.map((t) => {
            const meta = TABLE_STATUS[t.status];
            const small = reservation.guests > t.capacity;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSeat(t.id)}
                className="rounded-xl border-2 p-2 text-left hover:shadow"
                style={{ backgroundColor: meta.bg, borderColor: meta.border }}
              >
                <span className="block text-lg font-extrabold text-black">{t.name}</span>
                <span className="block text-[11px]" style={{ color: small ? "#B26A00" : AppColors.grey }}>{t.capacity} seats{small ? " · small" : ""}</span>
                {t.status === "reserved" && <PosPill bg="#fff" color={meta.color}>Reserved {t.reservation_time}</PosPill>}
              </button>
            );
          })}
        </div>
      )}
    </AppModal>
  );
}
