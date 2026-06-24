"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = value.padEnd(5, " ").split("").slice(0, 5);

  return (
    <div className="flex justify-evenly gap-2">
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
          className="w-[50px] h-14 text-center text-xl font-bold rounded-xl outline-none"
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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 flex items-center px-2 bg-white">
        <button type="button" onClick={() => router.back()} className="p-2">
          <span className="material-icons text-black">arrow_back</span>
        </button>
      </header>
      <div className="flex-1 px-5">
        <div className="h-5" />
        <h1 className="text-2xl font-bold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
          {isMatched ? "Code Matched! 👍" : "Recovery code 🚨"}
        </h1>
        <div className="h-1" />
        <p className="text-base leading-relaxed" style={{ color: AppColors.grey }}>
          {isMatched
            ? "The recovery code is match. Please proceed to set your new password."
            : "The recovery code was sent to your email. Code expiration time is 120s. Please enter the code:"}
        </p>
        <div className="h-8" />
        <OtpInput value={otp} onChange={setOtp} />
        <div className="h-8" />
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
    </div>
  );
}
