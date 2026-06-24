import clsx from "clsx";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "./AppAsset";

interface AppTileProps {
  title: string;
  leading?: string;
  onClick?: () => void;
  showArrow?: boolean;
  showAdd?: boolean;
  showNew?: boolean;
  trailing?: React.ReactNode;
  titleSuffix?: React.ReactNode;
  subTitle?: React.ReactNode;
  bgColor?: string;
  fgColor?: string;
  customTrailing?: React.ReactNode;
}

export function AppTile({
  title,
  leading,
  onClick,
  showArrow,
  showAdd,
  showNew,
  trailing,
  titleSuffix,
  subTitle,
  bgColor = AppColors.bgColor2,
  fgColor = AppColors.black,
  customTrailing,
}: AppTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center px-4 py-3 gap-3">
        {leading && (
          <AppAsset
            src={leading}
            width={24}
            height={24}
            style={{ filter: fgColor === AppColors.white ? "brightness(0) invert(1)" : undefined }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-base font-bold leading-tight"
              style={{ color: fgColor, fontFamily: "var(--font-poppins)" }}
            >
              {title}
            </span>
            {showNew && (
              <span
                className="px-2 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: AppColors.redText }}
              >
                NEW
              </span>
            )}
            {titleSuffix}
          </div>
          {subTitle}
        </div>
        {customTrailing ??
          (showArrow ? (
            <span className="material-icons" style={{ color: fgColor, fontSize: 22 }}>
              arrow_forward_ios
            </span>
          ) : showAdd ? (
            <span className="material-icons" style={{ color: fgColor, fontSize: 22 }}>
              add
            </span>
          ) : (
            trailing
          ))}
      </div>
    </button>
  );
}
