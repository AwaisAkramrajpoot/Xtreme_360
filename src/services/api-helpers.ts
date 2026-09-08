import type { AxiosResponse } from "axios";

export type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>) {
  return response.data.data;
}

export function appendIfPresent(formData: FormData, key: string, value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
}
