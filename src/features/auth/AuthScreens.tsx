"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import {
  getCurrentBusiness,
  resetPassword,
  sendPasswordResetOtp,
  verifyOtp,
} from "@/services/session-api";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorCode, getApiErrorMessage } from "@/utils/api-error";
import { isValidEmail } from "@/utils/helpers";
import { AccountStatusNotice } from "./AccountStatusNotice";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = value.padEnd(5, " ").split("").slice(0, 5);

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = value.padEnd(5, " ").split("");
            arr[i] = val || " ";
            onChange(arr.join("").trimEnd());
            if (val && i < 4) {
              const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
              next?.focus();
            }
          }}
          className="w-11 h-13 sm:w-[50px] sm:h-14 text-center text-xl font-bold rounded-xl outline-none"
          style={{
            color: AppColors.greyishBlack,
            border: `1px solid ${AppColors.lightPrimary}`,
            fontFamily: "var(--font-poppins)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = `2px solid ${AppColors.primary}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = `1px solid ${AppColors.lightPrimary}`;
          }}
        />
      ))}
    </div>
  );
}

export function VerifyEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendPasswordResetOtp(email);
      router.push(`${RouteName.verifyOtp}?email=${encodeURIComponent(email)}&flow=reset`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to send verification code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Recover Your Password"
      subtitle="Enter your email and we will send a verification code."
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSendCode();
        }}
      >
        <div className="flex justify-center lg:hidden mb-2">
          <AppAsset src={AppImages.verifyEmail} width={200} height={140} className="object-contain rounded-lg" />
        </div>
        <AppTextField
          title="Email"
          hintText="Enter your email"
          value={email}
          onChange={setEmail}
          error={error}
          name="email"
          type="email"
        />
        <AppButton text="Send Code" isLoading={loading} type="submit" />
      </form>
    </AuthSplitLayout>
  );
}

export function VerifyOtpScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const flow = searchParams.get("flow") ?? "signup";
  const justRegistered = searchParams.get("registered") === "1";
  const setToken = useAuthStore((s) => s.setToken);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    flow === "signup" && justRegistered ? "Account created. Verify your email to send it for admin approval." : ""
  );
  // Set when the email is verified but the account still needs Super Admin approval (or was rejected).
  const [accountNotice, setAccountNotice] = useState<{ status: "pending" | "rejected"; message: string } | null>(null);

  const handleVerifyOtp = async () => {
    if (!email) {
      setError("Missing email address");
      return;
    }
    if (otp.length < 5) {
      setError("Please enter the 5-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");
    try {
      const { accessToken, approvalStatus, message } = await verifyOtp({ email, otp });

      if (flow === "reset") {
        router.replace(`${RouteName.newPassword}?email=${encodeURIComponent(email)}`);
        return;
      }

      if (!accessToken) {
        setAccountNotice({
          status: "pending",
          message:
            approvalStatus === "pending" && message
              ? message
              : "Your account has been created successfully and is awaiting admin approval.",
        });
        return;
      }

      setToken(accessToken);

      try {
        await getCurrentBusiness();
        router.replace(RouteName.dashboard);
      } catch {
        router.replace(RouteName.businessRegisteration);
      }
    } catch (err) {
      if (getApiErrorCode(err) === "account_rejected") {
        setAccountNotice({ status: "rejected", message: getApiErrorMessage(err, "Your account was not approved.") });
        return;
      }
      setError(getApiErrorMessage(err, "Unable to verify code"));
    } finally {
      setLoading(false);
    }
  };

  const handleSecondaryAction = async () => {
    if (flow === "reset") {
      setLoading(true);
      setError("");
      setInfo("");
      try {
        await sendPasswordResetOtp(email);
        setInfo("A new code has been sent.");
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to resend code"));
      } finally {
        setLoading(false);
      }
      return;
    }

    router.push(RouteName.login);
  };

  if (accountNotice) {
    return (
      <AuthSplitLayout
        title={accountNotice.status === "pending" ? "Email Verified" : "Registration Update"}
        subtitle={accountNotice.status === "pending" ? "One more step before you can sign in." : "Your account cannot be used."}
      >
        <div className="space-y-6">
          <AccountStatusNotice status={accountNotice.status} message={accountNotice.message} />
          {accountNotice.status === "pending" && (
            <p className="text-sm leading-relaxed" style={{ color: AppColors.grey }}>
              An administrator will review your registration. Once it is approved, sign in with the email and password you
              registered with.
            </p>
          )}
          <AppButton text="Back to Login" type="button" onClick={() => router.replace(RouteName.login)} />
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Verification Code"
      subtitle="Enter the 5-digit code sent to your email."
    >
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleVerifyOtp();
        }}
      >
        <OtpInput value={otp} onChange={setOtp} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}
        <AppButton text="Verify Code" isLoading={loading} type="submit" />
        <button
          type="button"
          onClick={handleSecondaryAction}
          className="w-full text-sm font-medium hover:underline"
          style={{ color: AppColors.primary }}
        >
          {flow === "reset" ? "Resend Code" : "Back to Login"}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

export function NewPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) next.password = "Please enter password";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (!confirm) next.confirm = "Please confirm password";
    else if (password !== confirm) next.confirm = "Passwords do not match";
    if (!email) next.email = "Missing email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError("");
    try {
      await resetPassword({
        email,
        newPassword: password,
        confirmPassword: confirm,
      });
      router.replace(RouteName.login);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Unable to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="New Password"
      subtitle="Set a new password for your account."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleReset();
        }}
      >
        <AppTextField title="New password" hintText="*********" value={password} onChange={setPassword} isPasswordField error={errors.password} name="password" />
        <AppTextField title="Confirm password" hintText="*********" value={confirm} onChange={setConfirm} isPasswordField error={errors.confirm} name="confirmPassword" />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        <p className="text-xs -mt-2" style={{ color: AppColors.grey }}>
          Password must be at least 6 characters.
        </p>
        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <AppButton text="Save" isLoading={loading} type="submit" />
      </form>
    </AuthSplitLayout>
  );
}
