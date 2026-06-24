"use client";

import { Suspense } from "react";
import { VerifyOtpScreen } from "./AuthScreens";

export function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F6FA]" />}>
      <VerifyOtpScreen />
    </Suspense>
  );
}
