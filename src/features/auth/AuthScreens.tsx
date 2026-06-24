"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";

export function VerifyEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <AuthSplitLayout
      title="Recover Your Password! 🧐"
      subtitle="Select mobile number or email to verify by sending code:"
    >
      <div className="space-y-5">
        <div className="flex justify-center lg:hidden mb-2">
          <AppAsset src={AppImages.verifyEmail} width={200} height={140} className="object-contain rounded-lg" />
        </div>
        <AppTextField
          title="Email"
          hintText="Enter your email"
          value={email}
          onChange={setEmail}
          error={error}
        />
        <AppButton
          text="Send Code"
          isLoading={loading}
          onClick={() => {
            if (!email) { setError("Please enter your email"); return; }
            if (!isValidEmail(email)) { setError("Please enter a valid email"); return; }
            setLoading(true);
            setTimeout(() => router.push(`${RouteName.verifyOtp}?email=${encodeURIComponent(email)}`), 800);
          }}
        />
      </div>
    </AuthSplitLayout>
  );
}

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
          onFocus={(e) => { e.currentTarget.style.border = `2px solid ${AppColors.primary}`; }}
          onBlur={(e) => { e.currentTarget.style.border = `1px solid ${AppColors.lightPrimary}`; }}
        />
      ))}
    </div>
  );
}

export function VerifyOtpScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [isMatched, setIsMatched] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <AuthSplitLayout
      title={isMatched ? "Code Matched! 👍" : "Recovery code 🚨"}
      subtitle={
        isMatched
          ? "The recovery code is match. Please proceed to set your new password."
          : "The recovery code was sent to your email. Code expiration time is 120s. Please enter the code:"
      }
    >
      <div className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} />
        <AppButton
          text={isMatched ? "DONE" : "SEND AGAIN"}
          isLoading={loading}
          onClick={() => {
            if (!isMatched) {
              if (otp.length >= 4) setIsMatched(true);
              return;
            }
            setLoading(true);
            setTimeout(() => router.push(`${RouteName.newPassword}?email=${encodeURIComponent(email)}`), 500);
          }}
        />
      </div>
    </AuthSplitLayout>
  );
}

export function NewPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    <AuthSplitLayout
      title="New Password 🔐"
      subtitle="Your new password must be different from previously used passwords."
    >
      <div className="space-y-4">
        <AppTextField title="New password" hintText="*********" value={password} onChange={setPassword} isPasswordField error={errors.password} />
        <AppTextField title="Confirm password" hintText="*********" value={confirm} onChange={setConfirm} isPasswordField error={errors.confirm} />
        <p className="text-xs -mt-2" style={{ color: AppColors.grey }}>Password must be at least 6 character</p>
        <AppButton
          text="SAVE"
          isLoading={loading}
          onClick={() => {
            if (!validate()) return;
            setLoading(true);
            setTimeout(() => router.replace(RouteName.login), 800);
          }}
        />
      </div>
    </AuthSplitLayout>
  );
}
