"use client";

import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppColors } from "@/constants/colors";

export function EmployeeScreen() {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: AppColors.primary }}>
          Employees
        </h1>
        <AppButton
          text="Add Employee"
          onClick={() => router.push("/employee/add")}
          style={{ backgroundColor: AppColors.primary, color: "white" }}
        />
      </div>
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-center text-gray-500">No employees found.</p>
      </div>
    </div>
  );
}
