import { apiClient } from "@/services/api-client";
import { appendIfPresent, unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type PartyRecord = {
  id: number;
  user_id?: string;
  opening_date?: string | null;
  is_active?: boolean;
  party_type?: string | null;
  party_category?: string | null;
  party_name: string;
  opening_balance?: string | null;
  mobile_number?: string | null;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  cnc_number?: string | null;
  cnc_front_picture?: string | null;
  cnc_back_picture?: string | null;
  address?: string | null;
  emergency_number?: string | null;
  tin_number?: string | null;
  shipping_address?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreatePartyPayload = {
  partyName: string;
  openingDate?: string;
  isActive?: boolean;
  partyType?: string | null;
  partyCategory?: string | null;
  openingBalance?: string;
  mobileNumber?: string;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  cncNumber?: string;
  address?: string;
  emergencyNumber?: string;
  tinNumber?: string;
  shippingAddress?: string;
  cncFrontPicture?: File | null;
  cncBackPicture?: File | null;
};

export async function getParties() {
  const response = await apiClient.get<ApiEnvelope<PartyRecord[]>>("/parties/");
  return unwrap(response) ?? [];
}

export async function createParty(payload: CreatePartyPayload) {
  const formData = new FormData();
  formData.append("party_name", payload.partyName.trim());
  appendIfPresent(formData, "opening_date", payload.openingDate);
  appendIfPresent(formData, "is_active", payload.isActive ?? true);
  appendIfPresent(formData, "party_type", payload.partyType);
  appendIfPresent(formData, "party_category", payload.partyCategory);
  appendIfPresent(formData, "opening_balance", payload.openingBalance);
  appendIfPresent(formData, "mobile_number", payload.mobileNumber);
  appendIfPresent(formData, "country", payload.country);
  appendIfPresent(formData, "city", payload.city);
  appendIfPresent(formData, "area", payload.area);
  appendIfPresent(formData, "zone", payload.zone);
  appendIfPresent(formData, "cnc_number", payload.cncNumber);
  appendIfPresent(formData, "address", payload.address);
  appendIfPresent(formData, "emergency_number", payload.emergencyNumber);
  appendIfPresent(formData, "tin_number", payload.tinNumber);
  appendIfPresent(formData, "shipping_address", payload.shippingAddress);
  if (payload.cncFrontPicture) {
    formData.append("cnc_front_picture", payload.cncFrontPicture);
  }
  if (payload.cncBackPicture) {
    formData.append("cnc_back_picture", payload.cncBackPicture);
  }

  const response = await apiClient.post<ApiEnvelope<PartyRecord>>("/parties/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
}

export async function updateParty(partyId: number, payload: CreatePartyPayload) {
  const formData = new FormData();
  formData.append("party_name", payload.partyName.trim());
  appendIfPresent(formData, "opening_date", payload.openingDate);
  appendIfPresent(formData, "is_active", payload.isActive ?? true);
  appendIfPresent(formData, "party_type", payload.partyType);
  appendIfPresent(formData, "party_category", payload.partyCategory);
  appendIfPresent(formData, "opening_balance", payload.openingBalance);
  appendIfPresent(formData, "mobile_number", payload.mobileNumber);
  appendIfPresent(formData, "country", payload.country);
  appendIfPresent(formData, "city", payload.city);
  appendIfPresent(formData, "area", payload.area);
  appendIfPresent(formData, "zone", payload.zone);
  appendIfPresent(formData, "cnc_number", payload.cncNumber);
  appendIfPresent(formData, "address", payload.address);
  appendIfPresent(formData, "emergency_number", payload.emergencyNumber);
  appendIfPresent(formData, "tin_number", payload.tinNumber);
  appendIfPresent(formData, "shipping_address", payload.shippingAddress);
  if (payload.cncFrontPicture) {
    formData.append("cnc_front_picture", payload.cncFrontPicture);
  }
  if (payload.cncBackPicture) {
    formData.append("cnc_back_picture", payload.cncBackPicture);
  }

  const response = await apiClient.patch<ApiEnvelope<PartyRecord>>(`/parties/${partyId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
}

export async function deleteParty(partyId: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(`/parties/${partyId}`);
  return unwrap(response);
}
