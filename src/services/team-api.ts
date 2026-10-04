import { apiClient } from "@/services/api-client";
import { unwrap, type ApiEnvelope } from "@/services/api-helpers";
import type { Role } from "@/constants/permissions";

export type TeamMember = {
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  is_active: boolean;
  owner_user_id?: string | null;
  created_at?: string;
};

export type NewMemberPayload = { name: string; email: string; phone?: string; password: string; role: Exclude<Role, "owner"> };

export async function getTeam() {
  return unwrap(await apiClient.get<ApiEnvelope<TeamMember[]>>("/team")) ?? [];
}

export async function addTeamMember(payload: NewMemberPayload) {
  return unwrap(await apiClient.post<ApiEnvelope<TeamMember>>("/team", payload));
}

export async function updateTeamMember(userId: string, patch: { role?: Exclude<Role, "owner">; is_active?: boolean; name?: string }) {
  return unwrap(await apiClient.patch<ApiEnvelope<TeamMember>>(`/team/${userId}`, patch));
}

export async function removeTeamMember(userId: string) {
  await apiClient.delete(`/team/${userId}`);
}
