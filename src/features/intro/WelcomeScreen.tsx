"use client";

import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppAsset } from "@/components/ui/AppAsset";
import { PoweredBy } from "@/components/ui/PoweredBy";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { useResponsive } from "@/hooks/use-responsive";

export function WelcomeScreen() {
  const router = useRouter();
  const { isWebLayout } = useResponsive();

  if (isWebLayout) {
    return (
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
          style={{ backgroundColor: AppColors.primary }}
        >
          <div className="relative z-10">
            <AppAsset src={AppImages.logo} width={48} height={48} className="rounded-lg mb-6" />
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "var(--font-poppins)" }}>
              Welcome to Xtreme-360
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Log in or create an account to get started and unlock a seamless experience.
            </p>
          </div>
          <div className="relative z-10 flex justify-center">
            <AppAsset src={AppImages.splashImage} width={320} height={320} className="object-contain opacity-90" />
          </div>
          <PoweredBy />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F5F6FA]">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-black mb-2">Get Started</h2>
              <p className="text-sm" style={{ color: AppColors.grey }}>Choose how you&apos;d like to continue</p>
            </div>
            <AppButton text="Sign Up" onClick={() => router.push(RouteName.register)} />
            <AppButton
              text="Sign In"
              backgroundColor={AppColors.bordercolor}
              textColor={AppColors.greyishBlack}
              onClick={() => router.push(RouteName.login)}
            />
            <AppButton
              text="Guest Account"
              backgroundColor={AppColors.lightGrey}
              textColor={AppColors.black}
              onClick={() => router.replace(RouteName.bottomBar)}
            />
            <PoweredBy />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-[2]" />
      <div className="flex justify-center">
        <AppAsset src={AppImages.splashImage} width={250} height={250} className="w-[70vw] max-w-[280px] h-auto" />
      </div>
      <div className="flex-[2]" />
      <p className="text-center px-6" style={{ fontFamily: "var(--font-poppins)" }}>
        <span className="text-[26px] font-bold text-black">Welcome to </span>
        <span className="text-[26px] font-bold" style={{ color: AppColors.primary }}>Xtreme-360</span>
      </p>
      <div className="h-3" />
      <p className="text-center text-sm px-8 leading-relaxed" style={{ color: AppColors.grey }}>
        Log in or create an account to get started and unlock a seamless experience
      </p>
      <div className="flex-[2]" />
      <div className="px-4"><AppButton text="Sign Up" onClick={() => router.push(RouteName.register)} /></div>
      <div className="h-4" />
      <div className="px-4">
        <AppButton text="Sign In" backgroundColor={AppColors.bordercolor} textColor={AppColors.greyishBlack} onClick={() => router.push(RouteName.login)} />
      </div>
      <div className="h-4" />
      <div className="px-4">
        <AppButton text="Guest Account" backgroundColor={AppColors.bordercolor} textColor={AppColors.greyishBlack} onClick={() => router.replace(RouteName.bottomBar)} />
      </div>
      <div className="h-6" />
      <PoweredBy />
      <AppAsset src={AppImages.introFooter} width={800} height={60} className="w-full h-auto object-contain mt-4" />
    </div>
  );
}
