"use client";

import { useLayoutContext } from "./LayoutContext";
import { useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";

interface PageHeaderProps {
  title: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
}

export function PageHeader({
  title,
  showNotification,
  showAvatar,
  showSearch,
  showBack,
  actions,
  subtitle,
}: PageHeaderProps) {
  const { isDashboardShell } = useLayoutContext();
  const router = useRouter();

  if (isDashboardShell) {
    return (
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {showBack && (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm font-medium mb-2 hover:opacity-70"
                style={{ color: AppColors.primary }}
              >
                <span className="material-icons text-base">arrow_back</span>
                Back
              </button>
            )}
            <h1
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-black break-words"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: AppColors.grey }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {actions}
            {showSearch && (
              <button type="button" className="p-2 rounded-lg hover:bg-white transition-colors">
                <AppAsset src={AppImages.search} width={20} height={20} />
              </button>
            )}
            {showNotification && (
              <button type="button" className="p-2 rounded-lg hover:bg-white transition-colors relative">
                <AppAsset src={AppImages.bell} width={20} height={20} />
              </button>
            )}
            {showAvatar && (
              <AppAsset src={AppImages.staticUser} width={36} height={36} className="rounded-full" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
