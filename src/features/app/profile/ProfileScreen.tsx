"use client";

import { useCallback, useRef, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppBanner } from "@/components/ui/AppBanner";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { useSessionProfileStore } from "@/stores/session-profile-store";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

export function ProfileScreen() {
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const loading = useSessionProfileStore((s) => s.loading);
  const error = useSessionProfileStore((s) => s.error);
  const updateProfileImage = useSessionProfileStore((s) => s.updateProfileImage);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const displayName = user?.name ?? business?.person_name ?? "Account";
  const displayEmail = user?.email ?? business?.email ?? "";
  const avatarSrc = previewSrc ?? user?.profile_image ?? AppImages.staticUser;

  const openFilePicker = useCallback(() => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }, [uploading]);

  const handleAvatarKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFilePicker();
      }
    },
    [openFilePicker]
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setUploadError("Please select a valid image file.");
        return;
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        setUploadError("Image must be 5 MB or smaller.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
      setUploadError(null);
      setUploading(true);

      try {
        await updateProfileImage(file);
        setPreviewSrc(null);
      } catch (error) {
        setPreviewSrc(null);
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to upload profile picture. Please try again.";
        setUploadError(message);
      } finally {
        URL.revokeObjectURL(objectUrl);
        setUploading(false);
      }
    },
    [updateProfileImage]
  );

  return (
    <div className="flex min-h-full flex-col">
      <AppAppBar title="Profile" showNotification />
      <div className="flex-1">
        <div className="flex flex-col items-center gap-2.5 mb-4">
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div
              role="button"
              tabIndex={uploading ? -1 : 0}
              aria-label="Change profile picture"
              title="Change profile picture"
              onClick={openFilePicker}
              onKeyDown={handleAvatarKeyDown}
              className={`relative w-[100px] h-[100px] rounded-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 ${
                uploading ? "cursor-not-allowed opacity-90" : "cursor-pointer"
              }`}
              style={{
                border: `4px solid ${AppColors.primary}33`,
                boxShadow: `0 8px 20px ${AppColors.primary}26`,
              }}
            >
              <AppAsset
                src={avatarSrc}
                width={100}
                height={100}
                className="object-cover w-full h-full"
              />

              {!uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="px-2 text-center text-[11px] font-semibold leading-tight text-white">
                    Change Photo
                  </span>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <span className="material-icons animate-spin text-[28px] text-white">refresh</span>
                </div>
              )}
            </div>

            <div
              role="presentation"
              className={`absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform duration-200 ${
                uploading ? "opacity-70" : "group-hover:scale-110"
              }`}
              style={{
                backgroundColor: AppColors.primary,
                border: "3px solid white",
                boxShadow: `0 4px 8px ${AppColors.primary}4D`,
              }}
            >
              <span className="material-icons text-[15px]">photo_camera</span>
            </div>
          </div>

          <p className="text-base font-bold text-black">{displayName}</p>
          {displayEmail && <p className="text-base text-black">{displayEmail}</p>}
          {uploadError && <p className="text-sm text-red-500 text-center">{uploadError}</p>}
        </div>

        {loading && (
          <p className="mb-4 text-sm text-[#6B7280] text-center">Loading your profile...</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="h-4" />
        <AppBanner title="Personal Detail" />
        <div className="h-4" />
        <div className="space-y-4">
          <AppTextField
            title="Person Name"
            hintText="Enter Your Name"
            value={displayName}
            readOnly
          />
          <AppTextField title="Email" hintText="Enter your email" value={displayEmail} readOnly />
          <AppTextField
            title="Mobile Number"
            hintText="Enter mobile"
            value={user?.phone ?? ""}
            readOnly
          />
          <AppTextField title="PIN" hintText="Not available" value="" readOnly />
        </div>
        <div className="flex gap-4 justify-center items-center py-2">
          <AppAsset src={AppImages.fingerprint} width={48} height={48} />
          <AppAsset src={AppImages.faceRecognition} width={48} height={48} />
        </div>

        <div className="h-6" />
        <AppBanner title="Business Detail" />
        <div className="h-4" />
        <div className="space-y-4">
          <AppTextField
            title="Business Name"
            hintText="Enter business name"
            value={business?.name ?? ""}
            readOnly
          />
          <AppTextField
            title="Business Email"
            hintText="Enter business email"
            value={business?.email ?? ""}
            readOnly
          />
          <div className="flex gap-1">
            <div className="flex-1">
              <AppTextField title="Mobile Number" hintText="Phone" value={business?.mobile_number ?? ""} readOnly />
            </div>
            <div className="flex-1">
              <AppTextField
                title="Business Person Name"
                hintText="Name"
                value={business?.person_name ?? user?.name ?? ""}
                readOnly
              />
            </div>
          </div>
          <AppTextField title="Business Address" hintText="Address" value={business?.address ?? ""} maxLines={2} readOnly />
          <AppTextField
            title="Business Description"
            hintText="Description"
            value={business?.description ?? ""}
            maxLines={2}
            readOnly
          />
          <div>
            <p className="text-sm font-semibold mb-2">Business Signature</p>
            <div className="h-24 border rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-400">
              {business?.business_signature || "Not available"}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Business Logo</p>
            <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
              {business?.business_logo ? (
                <AppAsset src={business.business_logo} width={120} height={60} className="object-contain" />
              ) : (
                <>
                  <AppAsset src={AppImages.clickToUpload} width={40} height={40} />
                  <span className="text-sm text-gray-500">No business logo uploaded</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
