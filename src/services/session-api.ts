import type { AxiosResponse } from "axios";
import { apiClient } from "@/services/api-client";

type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export type LoginResult = {
  accessToken: string;
};

export type RegisterResult = {
  email: string;
};

/** Super Admin approval of a self-registered account. */
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type OtpResult = {
  /** Empty when no session was started (a password reset, or an account awaiting approval). */
  accessToken: string;
  approvalStatus?: ApprovalStatus;
  message: string;
};

export type ResetPasswordPayload = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

export type BusinessPayload = {
  userId: string;
  businessName: string;
  businessEmail: string;
  businessType: string;
  businessCategory: string;
  businessPersonName: string;
  businessAddress: string;
  businessDescription: string;
  businessPhone: string;
  businessSignature?: string;
  businessLogo?: File | null;
};

export type UserProfile = {
  id?: number;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  profile_image?: string | null;
  pin?: string | null;
  use_fingerprint?: boolean | null;
  use_face_recognition?: boolean | null;
  is_verified?: boolean;
  /** owner | manager | staff */
  role?: string;
  is_owner?: boolean;
  created_at?: string;
  updated_at?: string;
  businesses?: BusinessRecord[];
};

export type BusinessRecord = {
  id?: number;
  user_id?: string;
  name?: string;
  email?: string;
  type?: string;
  category?: string;
  person_name?: string;
  address?: string;
  description?: string;
  mobile_number?: string;
  business_signature?: string | null;
  business_logo?: string | null;
  created_at?: string;
  updated_at?: string;
};

function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>) {
  return response.data.data;
}

function normalizeToken(payload: { accessToken?: string; access_token?: string }) {
  return payload.accessToken ?? payload.access_token ?? "";
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}) {
  const response = await apiClient.post<ApiEnvelope<RegisterResult>>("/auth/register", {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    confirm_password: payload.confirmPassword,
  });
  return unwrap(response);
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiEnvelope<LoginResult>>("/auth/login", {
    username: payload.email,
    password: payload.password,
  });
  const data = unwrap(response) as LoginResult & { access_token?: string };
  return { accessToken: normalizeToken(data) };
}

export async function sendPasswordResetOtp(email: string) {
  const response = await apiClient.post<ApiEnvelope<RegisterResult>>("/auth/forgot-password", {
    email,
  });
  return unwrap(response);
}

export async function verifyOtp(payload: { email: string; otp: string }): Promise<OtpResult> {
  const response = await apiClient.post<
    ApiEnvelope<{ access_token?: string; accessToken?: string; approval_status?: ApprovalStatus }>
  >("/auth/verify-otp", payload);
  const data = unwrap(response) ?? {};
  return { accessToken: normalizeToken(data), approvalStatus: data.approval_status, message: response.data.message };
}

export async function resetPassword(payload: ResetPasswordPayload) {
  await apiClient.post<ApiEnvelope<Record<string, never>>>("/auth/reset-password", {
    email: payload.email,
    new_password: payload.newPassword,
    confirm_password: payload.confirmPassword,
  });
}

export async function logoutUser() {
  await apiClient.post<ApiEnvelope<Record<string, never>>>("/auth/logout");
}

export async function getCurrentUser() {
  const response = await apiClient.get<ApiEnvelope<UserProfile>>("/users/me");
  return unwrap(response);
}

export type UpdateUserProfilePayload = {
  name?: string;
  phone?: string;
  pin?: string;
  useFingerprint?: boolean;
  useFaceRecognition?: boolean;
  profileImage?: File | null;
};

export async function updateUserProfile(payload: UpdateUserProfilePayload) {
  const formData = new FormData();
  if (payload.name !== undefined) {
    formData.append("name", payload.name);
  }
  if (payload.phone !== undefined) {
    formData.append("phone", payload.phone);
  }
  if (payload.pin !== undefined) {
    formData.append("pin", payload.pin);
  }
  if (payload.useFingerprint !== undefined) {
    formData.append("use_fingerprint", String(payload.useFingerprint));
  }
  if (payload.useFaceRecognition !== undefined) {
    formData.append("use_face_recognition", String(payload.useFaceRecognition));
  }
  if (payload.profileImage) {
    formData.append("profile_image", payload.profileImage);
  }

  const response = await apiClient.patch<ApiEnvelope<UserProfile>>("/users/me", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}

export async function getCurrentBusiness() {
  const response = await apiClient.get<ApiEnvelope<BusinessRecord>>("/businesses/me");
  return unwrap(response);
}

export async function createBusiness(payload: BusinessPayload) {
  const formData = new FormData();
  formData.append("business_name", payload.businessName);
  formData.append("business_email", payload.businessEmail);
  formData.append("business_type", payload.businessType);
  formData.append("business_category", payload.businessCategory);
  formData.append("business_person_name", payload.businessPersonName);
  formData.append("business_address", payload.businessAddress);
  formData.append("business_description", payload.businessDescription);
  formData.append("business_phone", payload.businessPhone);
  if (payload.businessSignature) {
    formData.append("business_signature", payload.businessSignature);
  }
  if (payload.businessLogo) {
    formData.append("business_logo", payload.businessLogo);
  }

  const response = await apiClient.post<ApiEnvelope<BusinessRecord>>(
    `/businesses/${payload.userId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return unwrap(response);
}

export type UpdateBusinessPayload = {
  businessName?: string;
  businessEmail?: string;
  businessType?: string;
  businessCategory?: string;
  businessPersonName?: string;
  businessAddress?: string;
  businessDescription?: string;
  businessPhone?: string;
  businessSignature?: string;
  businessLogo?: File | null;
};

export async function updateBusinessDetails(businessId: number, payload: UpdateBusinessPayload) {
  const formData = new FormData();
  if (payload.businessName !== undefined) formData.append("business_name", payload.businessName);
  if (payload.businessEmail !== undefined) formData.append("business_email", payload.businessEmail);
  if (payload.businessType !== undefined) formData.append("business_type", payload.businessType);
  if (payload.businessCategory !== undefined) formData.append("business_category", payload.businessCategory);
  if (payload.businessPersonName !== undefined) formData.append("business_person_name", payload.businessPersonName);
  if (payload.businessAddress !== undefined) formData.append("business_address", payload.businessAddress);
  if (payload.businessDescription !== undefined) formData.append("business_description", payload.businessDescription);
  if (payload.businessPhone !== undefined) formData.append("business_phone", payload.businessPhone);
  if (payload.businessSignature !== undefined) formData.append("business_signature", payload.businessSignature);
  if (payload.businessLogo) formData.append("business_logo", payload.businessLogo);

  const response = await apiClient.patch<ApiEnvelope<BusinessRecord>>(`/businesses/${businessId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrap(response);
}
