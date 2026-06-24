"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppButton } from "@/components/ui/AppButton";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { IntroStepLayout } from "@/components/layout/IntroStepLayout";

const pages = [
  {
    image: AppImages.onboarding1,
    title: "All-in-One Business Management",
    description:
      "Manage inventory, sales, HR, and production — everything your business needs in one powerful app.",
  },
  {
    image: AppImages.onboarding2,
    title: "Simplify Operations",
    description:
      "Track stock, manage staff, and handle sales and distribution with ease and real-time control.",
  },
  {
    image: AppImages.onboarding3,
    title: "Grow with Smart Insights",
    description:
      "Boost productivity, reduce costs, and make better decisions with connected tools for every part of your business.",
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const isLast = currentPage === pages.length - 1;

  return (
    <IntroStepLayout
      title="Getting Started"
      maxWidth="lg"
      showCard={false}
      headerEnd={
        <button
          type="button"
          onClick={() => router.push(RouteName.welcome)}
          className="text-sm font-medium whitespace-nowrap"
          style={{ color: AppColors.primary, fontFamily: "var(--font-manrope)" }}
        >
          Skip
        </button>
      }
      footer={
        <AppButton
          text={isLast ? "Get Started" : "Next"}
          onClick={() => {
            if (isLast) router.push(RouteName.welcome);
            else setCurrentPage((p) => p + 1);
          }}
        />
      }
      contentClassName="items-center"
    >
      <div className="w-full bg-white rounded-2xl border p-6 sm:p-8 flex flex-col items-center min-h-[420px] sm:min-h-[480px]"
        style={{ borderColor: AppColors.lightGrey, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        <div className="flex-1 w-full overflow-hidden relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex flex-col items-center text-center"
            >
              <div className="flex items-center justify-center w-full mb-6 sm:mb-8">
                <AppAsset
                  src={pages[currentPage].image}
                  width={280}
                  height={280}
                  className="object-contain w-[min(280px,70vw)] h-auto"
                />
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold text-black px-2"
                style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
              >
                {pages[currentPage].title}
              </h2>
              <div className="h-3 sm:h-4" />
              <p
                className="text-base sm:text-lg max-w-md px-2 leading-relaxed"
                style={{ color: AppColors.darkGrey, fontFamily: "var(--font-manrope)" }}
              >
                {pages[currentPage].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-6 sm:mt-8">
          {pages.map((_, i) => (
            <span
              key={i}
              className="rounded-full border-[1.5px] transition-all"
              style={{
                width: i === currentPage ? 10 : 8,
                height: i === currentPage ? 10 : 8,
                backgroundColor: i === currentPage ? AppColors.primary : "transparent",
                borderColor: i === currentPage ? AppColors.primary : AppColors.grey,
              }}
            />
          ))}
        </div>
      </div>
    </IntroStepLayout>
  );
}
