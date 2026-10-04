import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";

/** Support tickets the signed-in user raised, with the Super Admin's reply. */
export type SupportTicket = {
  id: number;
  ticket_code: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  requester_phone: string | null;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

export async function getMySupportTickets() {
  return unwrap(await apiClient.get<ApiEnvelope<SupportTicket[]>>("/support-tickets")) ?? [];
}

export async function createSupportTicket(payload: { subject: string; description: string; priority: string; phone?: string }) {
  const response = await apiClient.post<ApiEnvelope<SupportTicket>>("/support-tickets", payload);
  return { ticket: unwrap(response), message: response.data.message };
}
