"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";
import { useAuthStore } from "@/stores/auth-store";
import { loginUser } from "@/services/session-api";
import { getApiErrorMessage } from "@/utils/api-error";

export function LoginScreen() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");

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
    setSubmitError("");
    try {
      const { accessToken } = await loginUser({ email, password });
      setToken(accessToken);
      router.replace(RouteName.dashboard);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to log in");
      if (message.toLowerCase().includes("not verified")) {
        router.replace(`${RouteName.verifyOtp}?email=${encodeURIComponent(email)}&flow=signup`);
        return;
      }
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Login to Your Account"
      subtitle="Don't miss out on the special event."
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void login();
        }}
      >
        <AppTextField
          title="Email"
          hintText="Enter your email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          name="email"
          type="email"
        />
        <AppTextField
          title="Password"
          hintText="Enter your password"
          value={password}
          onChange={setPassword}
          isPasswordField
          error={errors.password}
          name="password"
        />
        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={() => router.push(`${RouteName.verifyEmail}?flow=reset`)}
            className="text-xs font-medium hover:underline"
            style={{ color: AppColors.primary }}
          >
            Forgot password?
          </button>
        </div>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppButton text="Login" isLoading={loading} type="submit" />
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(140, 140, 161, 0.3)" }} />
          <span className="text-sm" style={{ color: AppColors.grey }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(140, 140, 161, 0.3)" }} />
        </div>

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
      </form>
    </AuthSplitLayout>
  );
}
