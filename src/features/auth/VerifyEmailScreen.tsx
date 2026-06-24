"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { isValidEmail } from "@/utils/helpers";

export function VerifyEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-14 flex items-center px-2 bg-white">
        <button type="button" onClick={() => router.back()} className="p-2">
          <span className="material-icons text-black">arrow_back</span>
        </button>
      </header>
      <div className="flex-1 px-5 overflow-auto text-center">
        <AppAsset src={AppImages.verifyEmail} width={280} height={200} className="mx-auto object-contain" />
        <h1 className="text-2xl font-bold text-black mt-4" style={{ fontFamily: "var(--font-poppins)" }}>
          Recover Your Password! 🧐
        </h1>
        <div className="h-3" />
        <p className="text-base leading-relaxed" style={{ color: AppColors.grey }}>
          Select mobile number or email to verify by sending code:
        </p>
        <div className="h-8 text-left">
          <AppTextField
            title="Email"
            hintText="Enter your email"
            value={email}
            onChange={setEmail}
            error={error}
          />
        </div>
        <div className="h-5" />
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
    </div>
  );
}
