"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";

export function NewPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) next.password = "Please enter password";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (!confirm) next.confirm = "Please confirm password";
    else if (password !== confirm) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 flex items-center px-2 bg-white">
        <button type="button" onClick={() => router.back()} className="p-2">
          <span className="material-icons text-black">arrow_back</span>
        </button>
      </header>
      <div className="flex-1 px-6 overflow-auto">
        <div className="h-5" />
        <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
          New Password 🔐
        </h1>
        <div className="h-3" />
        <p className="text-base leading-relaxed" style={{ color: AppColors.grey }}>
          Your new password must be different from previously used passwords.
        </p>
        <div className="h-8" />
        <AppTextField title="New password" hintText="*********" value={password} onChange={setPassword} isPasswordField error={errors.password} />
        <div className="h-5" />
        <AppTextField title="Confirm password" hintText="*********" value={confirm} onChange={setConfirm} isPasswordField error={errors.confirm} />
        <div className="h-2" />
        <p className="text-xs" style={{ color: AppColors.grey }}>Password must be at least 6 character</p>
        <div className="h-8" />
        <AppButton
          text="SAVE"
          isLoading={loading}
          onClick={() => {
            if (!validate()) return;
            setLoading(true);
            setTimeout(() => router.replace(RouteName.login), 800);
          }}
        />
        <div className="h-8" />
      </div>
    </div>
  );
}
