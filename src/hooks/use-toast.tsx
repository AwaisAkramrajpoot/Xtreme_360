"use client";

import { useState, useCallback, useRef } from "react";
import { AppColors } from "@/constants/colors";

export type ToastVariant = "success" | "error";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>("success");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, nextVariant: ToastVariant = "success") => {
    setMessage(msg);
    setVariant(nextVariant);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), 3000);
  }, []);

  const Toast = message ? (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4"
      style={{
        backgroundColor: variant === "error" ? "#D64545" : AppColors.primary,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {message}
    </div>
  ) : null;

  return { showToast, Toast };
}
