"use client";

import { Suspense } from "react";
import { NewPasswordScreen } from "./AuthScreens";

export function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F6FA]" />}>
      <NewPasswordScreen />
    </Suspense>
  );
}
