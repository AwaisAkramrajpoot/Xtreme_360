"use client";

import { useState, useCallback } from "react";
import { AppColors } from "@/constants/colors";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const Toast = message ? (
    <div
      className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4"
      style={{ backgroundColor: AppColors.primary, fontFamily: "var(--font-poppins)" }}
    >
      {message}
    </div>
  ) : null;

  return { showToast, Toast };
}
