import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppColors } from "@/constants/colors";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; position: string }) => void;
}

export function EmployeeModal({
  isOpen,
  onClose,
  onSubmit,
}: EmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({ name, email, position });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add Employee</h2>
        <AppTextField
          title="Name"
          hintText="Enter employee name"
          value={name}
          onChange={setName}
        />
        <AppTextField
          title="Email"
          hintText="Enter employee email"
          value={email}
          onChange={setEmail}
        />
        <AppTextField
          title="Position"
          hintText="Enter employee position"
          value={position}
          onChange={setPosition}
        />
        <div className="flex justify-end gap-2 mt-4">
          <AppButton text="Cancel" onClick={onClose} />
          <AppButton text="Submit" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
