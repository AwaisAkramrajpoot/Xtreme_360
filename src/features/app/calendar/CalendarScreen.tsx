"use client";

import { useCallback, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppModal } from "@/components/ui/AppModal";
import { AppTextField } from "@/components/ui/AppTextField";
import { FormButtonsRow } from "@/components/ui/FormButtonsRow";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { IconButton } from "@/components/ui/IconButton";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { AppColors } from "@/constants/colors";
import { useToast } from "@/hooks/use-toast";
import { useAsyncData } from "@/hooks/use-async-data";
import { getApiErrorMessage } from "@/utils/api-error";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  type CalendarEvent,
} from "@/services/calendar-api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function formatTime(value?: string | null) {
  if (!value) return "All day";
  const [h, m] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function EventModal({
  initial,
  defaultDate,
  onClose,
  onSaved,
}: {
  initial: CalendarEvent | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: (message: string, date: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.event_date ?? defaultDate);
  const [time, setTime] = useState(initial?.event_time ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim()) return setError("Enter an event title");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Choose a date");
    setSaving(true);
    setError("");
    const payload = { title, eventDate: date, eventTime: time, description };
    try {
      if (initial) await updateCalendarEvent(initial.id, payload);
      else await createCalendarEvent(payload);
      onSaved(initial ? "Event updated" : "Event added", date);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save event"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      onClose={onClose}
      title={initial ? "Update Event" : "Add Event"}
      size="md"
      footer={<FormButtonsRow onCancel={onClose} onSave={() => void save()} saveLabel={initial ? "Update Event" : "Save Event"} isLoading={saving} />}
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <AppTextField title="Event Title" hintText="Enter title" value={title} onChange={setTitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppTextField title="Date" hintText="yyyy-mm-dd" value={date} onChange={setDate} isDateField />
          <AppTextField title="Time" hintText="Optional" type="time" value={time} onChange={setTime} />
        </div>
        <AppTextField title="Description" hintText="Optional" value={description} onChange={setDescription} maxLines={3} />
      </div>
    </AppModal>
  );
}

export function CalendarScreen({ openAdd = false }: { openAdd?: boolean }) {
  const { showToast, Toast } = useToast();
  const { confirm } = useConfirm();
  const todayIso = toIso(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayIso);
  const [modal, setModal] = useState<{ open: boolean; event: CalendarEvent | null }>({ open: openAdd, event: null });

  const range = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return { from: toIso(first), to: toIso(last), daysInMonth: last.getDate(), offset: first.getDay() };
  }, [month]);

  const loader = useCallback(() => getCalendarEvents({ from: range.from, to: range.to }), [range.from, range.to]);
  const { data: events, loading, error, reload: load } = useAsyncData<CalendarEvent[]>(loader, [], "Failed to load events");

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) (map[e.event_date] ||= []).push(e);
    return map;
  }, [events]);

  const cells = Array.from({ length: Math.ceil((range.offset + range.daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - range.offset + 1;
    return day >= 1 && day <= range.daysInMonth ? day : null;
  });

  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const goToday = () => {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(todayIso);
  };

  const remove = async (event: CalendarEvent) => {
    const ok = await confirm({ title: "Delete event", message: `Delete "${event.title}"?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await deleteCalendarEvent(event.id);
      showToast("Event deleted");
      void load();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Failed to delete event"), "error");
    }
  };

  const selectedEvents = eventsByDay[selected] || [];
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col">
      <AppAppBar title="Calendar" showNotification showBack />
      <div className="grid gap-4 pb-20 md:pb-4 lg:grid-cols-5">
        <section className="rounded-2xl border bg-white p-4 lg:col-span-3 lg:p-5" style={{ borderColor: AppColors.lightGrey }}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <IconButton icon="chevron_left" label="Previous month" onClick={() => shiftMonth(-1)} />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-black">
                {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <button type="button" onClick={goToday} className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: AppColors.lightGrey, color: AppColors.primary }}>
                Today
              </button>
            </div>
            <IconButton icon="chevron_right" label="Next month" onClick={() => shiftMonth(1)} />
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold" style={{ color: AppColors.grey }}>
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`;
              const isSelected = iso === selected;
              const isToday = iso === todayIso;
              const hasEvents = Boolean(eventsByDay[iso]?.length);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-pressed={isSelected}
                  aria-label={`${iso}${hasEvents ? `, ${eventsByDay[iso].length} events` : ""}`}
                  className="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors hover:bg-[#F1F5F1]"
                  style={{
                    backgroundColor: isSelected ? AppColors.primary : undefined,
                    color: isSelected ? AppColors.white : AppColors.black,
                    fontWeight: isToday ? 700 : 400,
                    outline: isToday && !isSelected ? `1.5px solid ${AppColors.primary}` : undefined,
                  }}
                >
                  {day}
                  {hasEvents && (
                    <span
                      className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? AppColors.white : AppColors.primary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-500">
              {error}{" "}
              <button type="button" className="underline" onClick={() => void load()}>
                Retry
              </button>
            </p>
          )}
        </section>

        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-black">{selectedLabel}</h2>
            <button
              type="button"
              onClick={() => setModal({ open: true, event: null })}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: AppColors.primary }}
            >
              <span className="material-icons" style={{ fontSize: 18 }}>add</span>
              Add
            </button>
          </div>
          {loading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          ) : selectedEvents.length ? (
            selectedEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-2xl border bg-white p-4" style={{ borderColor: AppColors.lightGrey }}>
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: AppColors.primary }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-black">{event.title}</p>
                  <p className="text-sm" style={{ color: AppColors.grey }}>{formatTime(event.event_time)}</p>
                  {event.description && <p className="mt-1 text-sm text-black/80">{event.description}</p>}
                </div>
                <IconButton icon="edit" label="Edit event" variant="edit" size="sm" onClick={() => setModal({ open: true, event })} />
                <IconButton icon="delete" label="Delete event" variant="delete" size="sm" onClick={() => void remove(event)} />
              </div>
            ))
          ) : (
            <p className="rounded-2xl border bg-white px-4 py-8 text-center text-sm" style={{ borderColor: AppColors.lightGrey, color: AppColors.grey }}>
              No events on this day.
            </p>
          )}
        </section>
      </div>

      <FloatingActionButton onClick={() => setModal({ open: true, event: null })} />

      {modal.open && (
        <EventModal
          initial={modal.event}
          defaultDate={selected}
          onClose={() => setModal({ open: false, event: null })}
          onSaved={(message, date) => {
            showToast(message);
            setSelected(date);
            const d = new Date(`${date}T00:00:00`);
            if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) {
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            } else {
              void load();
            }
          }}
        />
      )}
      {Toast}
    </div>
  );
}
