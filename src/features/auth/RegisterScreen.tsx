"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";
import { registerUser } from "@/services/session-api";
import { getApiErrorMessage } from "@/utils/api-error";

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name) next.name = "Please enter your name";
    if (!email) next.email = "Please enter your email";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email";
    if (!password) next.password = "Please enter your password";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (!confirmPassword) next.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError("");
    try {
      await registerUser({
        name,
        email,
        password,
        confirmPassword,
      });
      router.push(`${RouteName.verifyOtp}?email=${encodeURIComponent(email)}&flow=signup&registered=1`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Sign up to continue"
      subtitle="Create your account to get started with Xtreme-360."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleRegister();
        }}
      >
        <AppTextField title="Name" hintText="Enter Your Name" value={name} onChange={setName} error={errors.name} name="name" />
        <AppTextField title="Email" hintText="Enter your email" value={email} onChange={setEmail} error={errors.email} name="email" type="email" />
        <AppTextField title="Password" hintText="Enter your password" value={password} onChange={setPassword} isPasswordField error={errors.password} name="password" />
        <AppTextField
          title="Confirm Password"
          hintText="Confirm your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          isPasswordField
          error={errors.confirmPassword}
          name="confirmPassword"
        />
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppButton text="Create Account" isLoading={loading} type="submit" />
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
      </form>
    </AuthSplitLayout>
  );
}
