"use client";

import clsx from "clsx";
import { AppColors } from "@/constants/colors";

type IconButtonVariant = "default" | "edit" | "delete" | "danger";

interface IconButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  variant?: IconButtonVariant;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

const variantStyles: Record<IconButtonVariant, { color: string; hoverBg: string }> = {
  default: { color: AppColors.greyishBlack, hoverBg: "rgba(0,0,0,0.06)" },
  edit: { color: AppColors.inkBlue, hoverBg: "rgba(41,108,178,0.12)" },
  delete: { color: AppColors.redText, hoverBg: "rgba(168,47,47,0.12)" },
  danger: { color: AppColors.redText, hoverBg: "rgba(168,47,47,0.12)" },
};

export function IconButton({
  icon,
  label,
  onClick,
  variant = "default",
  size = "md",
  className,
  disabled,
}: IconButtonProps) {
  const styles = variantStyles[variant];
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const fontSize = size === "sm" ? 18 : 20;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        dim,
        className
      )}
      style={{ color: styles.color }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span className="material-icons select-none" style={{ fontSize, lineHeight: 1 }}>
        {icon}
      </span>
    </button>
  );
}
