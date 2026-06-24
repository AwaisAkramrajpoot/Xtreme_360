"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { AppColors } from "@/constants/colors";

export type ModalSize = "sm" | "md" | "lg" | "xl";

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}: AppModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "relative w-full flex flex-col max-h-[90vh] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: AppColors.lightGrey }}
        >
          <h2
            id="modal-title"
            className="text-xl font-bold text-black"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <span className="material-icons text-[#646464]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div
            className="px-6 py-4 border-t shrink-0 bg-[#FAFAFA] rounded-b-2xl"
            style={{ borderColor: AppColors.lightGrey }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
