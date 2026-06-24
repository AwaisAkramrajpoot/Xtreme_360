"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth-store";

export function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email) next.email = "Please enter your email";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email";
    if (!password) next.password = "Please enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const login = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      setToken(data.token ?? data.accessToken);
      router.replace(RouteName.bottomBar);
    } catch {
      router.replace(RouteName.bottomBar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Login to Your Account"
      subtitle="Don't miss out on the special event."
    >
      <div className="space-y-5">
        <AppTextField title="Email" hintText="Enter your email" value={email} onChange={setEmail} error={errors.email} />
        <AppTextField
          title="Password"
          hintText="Enter your password"
          value={password}
          onChange={setPassword}
          isPasswordField
          error={errors.password}
        />
        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={() => router.push(RouteName.verifyEmail)}
            className="text-xs font-medium hover:underline"
            style={{ color: AppColors.primary }}
          >
            Forgot password?
          </button>
        </div>
        <AppButton text="Login" isLoading={loading} onClick={login} />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(140, 140, 161, 0.3)" }} />
          <span className="text-sm" style={{ color: AppColors.grey }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(140, 140, 161, 0.3)" }} />
        </div>
        <AppButton
          text="Guest Account"
          backgroundColor={AppColors.lightGrey}
          textColor={AppColors.black}
          onClick={() => router.replace(RouteName.bottomBar)}
        />
        <p className="text-center text-sm" style={{ color: AppColors.grey }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push(RouteName.register)}
            className="font-semibold hover:underline"
            style={{ color: AppColors.primary }}
          >
            Sign up
          </button>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
