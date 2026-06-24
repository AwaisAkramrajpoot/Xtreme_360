"use client";

import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import clsx from "clsx";

interface IntroStepLayoutProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerStart?: React.ReactNode;
  headerEnd?: React.ReactNode;
  showCard?: boolean;
  contentClassName?: string;
  maxWidth?: "sm" | "md" | "lg";
}

const maxWidthClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
};

export function IntroStepLayout({
  title,
  children,
  footer,
  headerStart,
  headerEnd,
  showCard = true,
  contentClassName,
  maxWidth = "md",
}: IntroStepLayoutProps) {
  const containerClass = maxWidthClasses[maxWidth];

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <header
        className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b shrink-0"
        style={{ borderColor: AppColors.lightGrey }}
      >
        <div
          className={clsx(
            "mx-auto w-full px-4 sm:px-6 h-14 flex items-center gap-3",
            containerClass
          )}
        >
          <div className="w-16 shrink-0 flex justify-start">{headerStart}</div>
          <h1
            className="flex-1 text-center text-base sm:text-lg font-semibold text-black truncate"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {title}
          </h1>
          <div className="w-16 shrink-0 flex justify-end">{headerEnd}</div>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <div
          className={clsx(
            "flex-1 w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col",
            containerClass
          )}
        >
          {showCard ? (
            <div
              className={clsx(
                "flex-1 bg-white rounded-2xl border shadow-sm p-5 sm:p-7 flex flex-col",
                contentClassName
              )}
              style={{
                borderColor: AppColors.lightGrey,
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              {children}
            </div>
          ) : (
            <div className={clsx("flex-1 flex flex-col", contentClassName)}>{children}</div>
          )}
        </div>

        {footer && (
          <div className={clsx("w-full mx-auto px-4 sm:px-6 pb-6 shrink-0", containerClass)}>
            {footer}
          </div>
        )}
      </div>

      <div className={clsx("w-full mx-auto px-4 sm:px-6 pb-4 sm:pb-6 shrink-0", "max-w-2xl")}>
        <AppAsset
          src={AppImages.introFooter}
          width={800}
          height={60}
          className="w-full h-auto object-contain opacity-80"
        />
      </div>
    </div>
  );
}
