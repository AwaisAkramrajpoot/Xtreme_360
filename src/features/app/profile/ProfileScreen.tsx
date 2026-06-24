"use client";

import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppBanner } from "@/components/ui/AppBanner";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";

export function ProfileScreen() {
  return (
    <div className="min-h-full bg-white flex flex-col">
      <AppAppBar title="Profile" showNotification />
      <div className="flex-1 overflow-auto px-[18px] py-1.5">
        <div className="flex flex-col items-center gap-2.5 mb-4">
          <div className="relative">
            <div
              className="w-[100px] h-[100px] rounded-full overflow-hidden"
              style={{ border: `4px solid ${AppColors.primary}33`, boxShadow: `0 8px 20px ${AppColors.primary}26` }}
            >
              <AppAsset src={AppImages.staticUser} width={100} height={100} className="object-cover" />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: AppColors.primary, border: "3px solid white", boxShadow: `0 4px 8px ${AppColors.primary}4D` }}
            >
              <span className="material-icons text-[13px]">photo_camera</span>
            </button>
          </div>
          <p className="text-base font-bold text-black">Xtreme 360</p>
          <p className="text-base text-black">john.doe@example.com</p>
        </div>

        <div className="h-4" />
        <AppBanner title="Personal Detail" />
        <div className="h-4" />
        <div className="space-y-4">
          <AppTextField title="Person Name" hintText="Enter Your Name" defaultValue="John Doe" />
          <AppTextField title="Email" hintText="Enter your email" defaultValue="john.doe@example.com" />
          <AppTextField title="Mobile Number" hintText="Enter mobile" defaultValue="+92 300 1234567" />
          <AppTextField title="PIN" hintText="Enter PIN" defaultValue="1234" />
        </div>
        <div className="h-4 flex gap-4 justify-center">
          <AppAsset src={AppImages.fingerprint} width={48} height={48} />
          <AppAsset src={AppImages.faceRecognition} width={48} height={48} />
        </div>

        <div className="h-6" />
        <AppBanner title="Business Detail" />
        <div className="h-4" />
        <div className="space-y-4">
          <AppTextField title="Business Name" hintText="Enter business name" defaultValue="Xtreme 360" />
          <AppTextField title="Business Email" hintText="Enter business email" />
          <div className="flex gap-1">
            <div className="flex-1"><AppTextField title="Mobile Number" hintText="Phone" /></div>
            <div className="flex-1"><AppTextField title="Business Person Name" hintText="Name" /></div>
          </div>
          <AppTextField title="Business Address" hintText="Address" maxLines={2} />
          <AppTextField title="Business Description" hintText="Description" maxLines={2} />
          <div>
            <p className="text-sm font-semibold mb-2">Business Signature</p>
            <div className="h-24 border rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-400">
              Sign here
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Business Logo</p>
            <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
              <AppAsset src={AppImages.clickToUpload} width={40} height={40} />
              <span className="text-sm text-gray-500">Click to upload</span>
            </div>
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
