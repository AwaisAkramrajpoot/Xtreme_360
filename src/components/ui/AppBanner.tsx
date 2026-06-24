import { AppColors } from "@/constants/colors";

interface AppBannerProps {
  title: string;
}

export function AppBanner({ title }: AppBannerProps) {
  return (
    <div
      className="px-4 py-3 rounded-lg flex items-center"
      style={{ backgroundColor: AppColors.primary }}
    >
      <span
        className="text-base font-semibold text-white"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        {title}
      </span>
    </div>
  );
}
