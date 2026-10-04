"use client";

import clsx from "clsx";
import { AppColors } from "@/constants/colors";

/* Small building blocks shared by the restaurant POS screens. */

export const posInput =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:border-[#588157] focus:ring-2 focus:ring-[#588157]/20 disabled:bg-[#F4F4F4]";

export function PosPill({ bg, color, icon, children }: { bg: string; color: string; icon?: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: bg, color }}>
      {icon && <span aria-hidden className="material-icons text-[13px]">{icon}</span>}
      {children}
    </span>
  );
}

type Variant = "primary" | "outline" | "danger" | "warning" | "ghost";

export function PosButton({
  children,
  icon,
  variant = "outline",
  onClick,
  disabled,
  loading,
  className,
  type = "button",
  title,
}: {
  children?: React.ReactNode;
  icon?: string;
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { backgroundColor: AppColors.primary, color: "#fff", borderColor: AppColors.primary },
    outline: { backgroundColor: "#fff", color: "#1F2937", borderColor: AppColors.lightGrey },
    danger: { backgroundColor: "#fff", color: AppColors.redText, borderColor: "#F5C2C0" },
    warning: { backgroundColor: "#F57C00", color: "#fff", borderColor: "#F57C00" },
    ghost: { backgroundColor: "transparent", color: AppColors.primary, borderColor: "transparent" },
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={styles[variant]}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        icon && <span aria-hidden className="material-icons text-[18px]">{icon}</span>
      )}
      {children}
    </button>
  );
}

export function PosField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold" style={{ color: AppColors.grey }}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function PosEmpty({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-white px-6 py-14 text-center" style={{ borderColor: AppColors.lightGrey }}>
      <span aria-hidden className="material-icons text-5xl" style={{ color: "#C9CBD3" }}>{icon}</span>
      <p className="text-sm font-semibold text-black">{title}</p>
      {hint && <p className="max-w-sm text-xs" style={{ color: AppColors.grey }}>{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
