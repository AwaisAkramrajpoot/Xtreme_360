"use client";

import { useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { PoweredBy } from "@/components/ui/PoweredBy";
import { useResponsive } from "@/hooks/use-responsive";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  footer?: React.ReactNode;
}

export function AuthSplitLayout({
  children,
  title,
  subtitle,
  showBack = true,
  footer,
}: AuthSplitLayoutProps) {
  const router = useRouter();
  const { isWebLayout } = useResponsive();

  if (!isWebLayout) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {showBack && (
          <header className="h-14 flex items-center px-2 bg-white shrink-0">
            <button type="button" onClick={() => router.back()} className="p-2">
              <span className="material-icons text-black">arrow_back</span>
            </button>
          </header>
        )}
        <div className="flex-1 px-6 py-4 overflow-auto">{children}</div>
        {footer && <div className="px-6 pb-6">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: AppColors.primary }}
      >
        <div className="relative z-10">
          <AppAsset src={AppImages.logo} width={48} height={48} className="rounded-lg mb-8" />
          <h1
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Xtreme-360
          </h1>
          <p className="text-lg text-white/80 max-w-md leading-relaxed" style={{ fontFamily: "var(--font-poppins)" }}>
            All-in-one business management — inventory, sales, HR, and production in one powerful platform.
          </p>
        </div>
        <div className="relative z-10 flex justify-center">
          <AppAsset
            src={AppImages.splashImage}
            width={360}
            height={360}
            className="object-contain opacity-90"
          />
        </div>
        <div className="relative z-10">
          <p className="text-sm text-white/60">Powered by Xtreme Computer</p>
        </div>
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: AppColors.white }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: AppColors.white }}
        />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#F5F6FA]">
        {showBack && (
          <header className="h-16 flex items-center px-8 bg-white border-b shrink-0" style={{ borderColor: AppColors.lightGrey }}>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: AppColors.greyishBlack }}
            >
              <span className="material-icons text-xl">arrow_back</span>
              Back
            </button>
          </header>
        )}
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="w-full max-w-[440px] bg-white rounded-2xl p-8 xl:p-10"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <h2
              className="text-2xl xl:text-3xl font-bold text-black mb-2"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm mb-8" style={{ color: AppColors.grey, fontFamily: "var(--font-poppins)" }}>
                {subtitle}
              </p>
            )}
            {!subtitle && <div className="mb-8" />}
            {children}
          </div>
        </div>
        {footer && (
          <div className="pb-8 flex justify-center">
            {footer}
          </div>
        )}
        {!footer && (
          <div className="pb-8 flex justify-center">
            <PoweredBy />
          </div>
        )}
      </div>
    </div>
  );
}
