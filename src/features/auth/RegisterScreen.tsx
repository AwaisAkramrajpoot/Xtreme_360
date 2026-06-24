"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name) next.name = "Please enter your name";
    if (!email) next.email = "Please enter your email";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email";
    if (!password) next.password = "Please enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <AuthSplitLayout
      title="Sign up to continue"
      subtitle="Create your account to get started with Xtreme-360."
    >
      <div className="space-y-4">
        <AppTextField title="Name" hintText="Enter Your Name" value={name} onChange={setName} error={errors.name} />
        <AppTextField title="Email" hintText="Enter your email" value={email} onChange={setEmail} error={errors.email} />
        <AppTextField title="Password" hintText="Enter your password" value={password} onChange={setPassword} isPasswordField error={errors.password} />
        <AppButton
          text="Create Account"
          isLoading={loading}
          onClick={() => {
            if (!validate()) return;
            setLoading(true);
            setTimeout(() => router.push(RouteName.businessRegisteration), 800);
          }}
        />
        <p className="text-center text-sm" style={{ color: AppColors.grey }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push(RouteName.login)}
            className="font-semibold hover:underline"
            style={{ color: AppColors.primary }}
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
