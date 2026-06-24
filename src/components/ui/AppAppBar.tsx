"use client";

import { useRouter } from "next/navigation";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "./AppAsset";
import { AppImages } from "@/constants/images";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import { PageHeader } from "@/components/layout/PageHeader";

interface AppAppBarProps {
  title: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
}

export function AppAppBar({
  title,
  showNotification,
  showAvatar,
  showSearch,
  showBack,
  actions,
  subtitle,
}: AppAppBarProps) {
  const router = useRouter();
  const { isDashboardShell } = useLayoutContext();

  if (isDashboardShell) {
    return (
      <PageHeader
        title={title}
        showNotification={showNotification}
        showAvatar={showAvatar}
        showSearch={showSearch}
        showBack={showBack}
        actions={actions}
        subtitle={subtitle}
      />
    );
  }

  return (
    <header
      className="flex items-center justify-between h-14 px-4 bg-white shrink-0 border-b lg:border-none"
      style={{ fontFamily: "var(--font-poppins)", borderColor: AppColors.lightGrey }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <button type="button" onClick={() => router.back()} className="p-1 -ml-1">
            <span className="material-icons text-black">arrow_back</span>
          </button>
        )}
        <h1 className="text-xl lg:text-2xl font-bold text-black truncate">{title}</h1>
      </div>
      <div className="flex items-center shrink-0">
        {actions}
        {showAvatar && (
          <AppAsset
            src={AppImages.staticUser}
            width={36}
            height={36}
            className="rounded-full"
          />
        )}
        {showSearch && (
          <div className="ml-3">
            <AppAsset src={AppImages.search} width={24} height={24} />
          </div>
        )}
        {showNotification && (
          <div className="ml-3">
            <AppAsset src={AppImages.bell} width={24} height={24} />
          </div>
        )}
        <div className="w-4" />
      </div>
    </header>
  );
}
