import clsx from "clsx";
import { AppColors } from "@/constants/colors";

interface AppButtonProps {
  text: string;
  onClick?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  radius?: number;
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function AppButton({
  text,
  onClick,
  backgroundColor = AppColors.primary,
  borderColor,
  textColor = AppColors.white,
  fontSize = 14,
  radius = 4,
  isLoading = false,
  icon,
  className,
  type = "button",
  disabled,
}: AppButtonProps) {
  const border = borderColor ?? backgroundColor;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx("w-full h-14 flex items-center justify-center", className)}
      style={{
        backgroundColor,
        borderRadius: radius,
        border: `1px solid ${border}`,
        color: textColor,
        fontSize,
        fontWeight: 600,
        fontFamily: "var(--font-poppins)",
      }}
    >
      {isLoading ? (
        <span
          className="inline-block w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: textColor, borderTopColor: "transparent" }}
        />
      ) : (
        <span className="flex items-center justify-center gap-1.5">
          {icon}
          <span>{text}</span>
        </span>
      )}
    </button>
  );
}
