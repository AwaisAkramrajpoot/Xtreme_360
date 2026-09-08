import { apiClient } from "@/services/api-client";
import { appendIfPresent, unwrap, type ApiEnvelope } from "@/services/api-helpers";

export type EmployeeRecord = {
  id: number;
  user_id?: string;
  opening_date?: string | null;
  joining_date?: string | null;
  employee_name: string;
  father_name?: string | null;
  date_of_birth?: string | null;
  mobile_number: string;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  cnc_number?: string | null;
  cnc_front_picture?: string | null;
  cnc_back_picture?: string | null;
  address?: string | null;
  department?: string | null;
  designation?: string | null;
  basic_salary?: string | null;
  allowance?: string | null;
  deduction?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateEmployeePayload = {
  employeeName: string;
  mobileNumber: string;
  openingDate?: string;
  joiningDate?: string;
  fatherName?: string;
  dateOfBirth?: string;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  zone?: string | null;
  cncNumber?: string;
  address?: string;
  department?: string;
  designation?: string;
  basicSalary?: string;
  allowance?: string;
  deduction?: string;
  cncFrontPicture?: File | null;
  cncBackPicture?: File | null;
};

export async function getEmployees() {
  const response = await apiClient.get<ApiEnvelope<EmployeeRecord[]>>("/employees/");
  return unwrap(response) ?? [];
}

export async function createEmployee(payload: CreateEmployeePayload) {
  const formData = new FormData();
  formData.append("employee_name", payload.employeeName.trim());
  formData.append("mobile_number", payload.mobileNumber.trim());
  appendIfPresent(formData, "opening_date", payload.openingDate);
  appendIfPresent(formData, "joining_date", payload.joiningDate);
  appendIfPresent(formData, "father_name", payload.fatherName);
  appendIfPresent(formData, "date_of_birth", payload.dateOfBirth);
  appendIfPresent(formData, "country", payload.country);
  appendIfPresent(formData, "city", payload.city);
  appendIfPresent(formData, "area", payload.area);
  appendIfPresent(formData, "zone", payload.zone);
  appendIfPresent(formData, "cnc_number", payload.cncNumber);
  appendIfPresent(formData, "address", payload.address);
  appendIfPresent(formData, "department", payload.department);
  appendIfPresent(formData, "designation", payload.designation);
  appendIfPresent(formData, "basic_salary", payload.basicSalary);
  appendIfPresent(formData, "allowance", payload.allowance);
  appendIfPresent(formData, "deduction", payload.deduction);
  if (payload.cncFrontPicture) {
    formData.append("cnc_front_picture", payload.cncFrontPicture);
  }
  if (payload.cncBackPicture) {
    formData.append("cnc_back_picture", payload.cncBackPicture);
  }

  const response = await apiClient.post<ApiEnvelope<EmployeeRecord>>("/employees/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(response);
}

export async function updateEmployee(employeeId: number, payload: CreateEmployeePayload) {
  const formData = new FormData();
  formData.append("employee_name", payload.employeeName.trim());
  formData.append("mobile_number", payload.mobileNumber.trim());
  appendIfPresent(formData, "opening_date", payload.openingDate);
  appendIfPresent(formData, "joining_date", payload.joiningDate);
  appendIfPresent(formData, "father_name", payload.fatherName);
  appendIfPresent(formData, "date_of_birth", payload.dateOfBirth);
  appendIfPresent(formData, "country", payload.country);
  appendIfPresent(formData, "city", payload.city);
  appendIfPresent(formData, "area", payload.area);
  appendIfPresent(formData, "zone", payload.zone);
  appendIfPresent(formData, "cnc_number", payload.cncNumber);
  appendIfPresent(formData, "address", payload.address);
  appendIfPresent(formData, "department", payload.department);
  appendIfPresent(formData, "designation", payload.designation);
  appendIfPresent(formData, "basic_salary", payload.basicSalary);
  appendIfPresent(formData, "allowance", payload.allowance);
  appendIfPresent(formData, "deduction", payload.deduction);
  if (payload.cncFrontPicture) {
    formData.append("cnc_front_picture", payload.cncFrontPicture);
  }
  if (payload.cncBackPicture) {
    formData.append("cnc_back_picture", payload.cncBackPicture);
  }

  const response = await apiClient.patch<ApiEnvelope<EmployeeRecord>>(
    `/employees/${employeeId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return unwrap(response);
}

export async function deleteEmployee(employeeId: number) {
  const response = await apiClient.delete<ApiEnvelope<Record<string, never>>>(`/employees/${employeeId}`);
  return unwrap(response);
}
