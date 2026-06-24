"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { apiClient } from "@/services/api-client";

export function SplashView() {
  const router = useRouter();
  const { token, isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!token) {
        if (!isInitialized) {
          setInitialized(true);
          router.replace(RouteName.languageSelection);
        } else {
          router.replace(RouteName.welcome);
        }
        return;
      }

      try {
        await apiClient.get("/users/profile");
        router.replace(RouteName.bottomBar);
      } catch {
        router.replace(RouteName.welcome);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [token, isInitialized, router, setInitialized]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <AppAsset src={AppImages.splashImage} width={300} height={300} />
    </div>
  );
}
