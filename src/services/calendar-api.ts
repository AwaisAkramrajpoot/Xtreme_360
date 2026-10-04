import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type CalendarEvent = {
  id: number;
  title: string;
  /** YYYY-MM-DD */
  event_date: string;
  /** HH:MM (24h) */
  event_time?: string | null;
  description?: string | null;
};

export type CalendarEventPayload = {
  title: string;
  eventDate: string;
  eventTime?: string;
  description?: string;
};

const body = (p: CalendarEventPayload) => ({
  title: p.title.trim(),
  event_date: p.eventDate,
  event_time: p.eventTime || "",
  description: p.description || "",
});

export async function getCalendarEvents(range: { from?: string; to?: string } = {}) {
  const response = await apiClient.get<ApiEnvelope<CalendarEvent[]>>("/calendar-events", { params: range });
  return unwrap(response) ?? [];
}

export async function createCalendarEvent(payload: CalendarEventPayload) {
  const response = await apiClient.post<ApiEnvelope<CalendarEvent>>("/calendar-events", body(payload));
  return unwrap(response);
}

export async function updateCalendarEvent(id: number, payload: CalendarEventPayload) {
  const response = await apiClient.patch<ApiEnvelope<CalendarEvent>>(`/calendar-events/${id}`, body(payload));
  return unwrap(response);
}

export async function deleteCalendarEvent(id: number) {
  await apiClient.delete(`/calendar-events/${id}`);
}
