"use client";

import { useEffect, useCallback, useId, useState } from "react";
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
  /** Optional Material icon name shown before the title. */
  titleIcon?: string;
}

// Open modals, innermost last, so a modal opened from inside another one
// (e.g. Add Unit over Add Item) is the only one that reacts to Escape.
const openModalStack: symbol[] = [];

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
  titleIcon,
}: AppModalProps) {
  const [modalId] = useState(() => Symbol("modal"));
  const titleId = useId();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openModalStack[openModalStack.length - 1] !== modalId) return;
      onClose();
    },
    [onClose, modalId]
  );

  useEffect(() => {
    if (!open) return;
    openModalStack.push(modalId);
    document.body.style.overflow = "hidden";
    return () => {
      const index = openModalStack.lastIndexOf(modalId);
      if (index !== -1) openModalStack.splice(index, 1);
      if (openModalStack.length === 0) document.body.style.overflow = "";
    };
  }, [open, modalId]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
            id={titleId}
            className="flex items-center gap-2 text-xl font-bold text-black"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {titleIcon && (
              <span className="material-icons text-[22px]" style={{ color: AppColors.primary }} aria-hidden>
                {titleIcon}
              </span>
            )}
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
