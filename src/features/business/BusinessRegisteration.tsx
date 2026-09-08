"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { ExpansionSelectionTile } from "@/components/ui/ExpansionSelectionTile";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { createBusiness, getCurrentUser } from "@/services/session-api";
import { getApiErrorMessage } from "@/utils/api-error";

const businessTypes = ["Retail", "Distribution", "Whole Sale"];
const categories = [
  "Other",
  "Food",
  "Restaurant",
  "Bakery",
  "Crockery",
  "Dairy",
  "Poultry",
  "Banquet",
  "Catering",
  "Kitchen",
  "Pak wan Center",
  "Motor Parts",
];

export function BusinessRegisteration() {
  const router = useRouter();
  const logoInputId = useId();
  const userId = useAuthStore((s) => s.userId);
  const userEmail = useAuthStore((s) => s.userEmail);
  const userName = useAuthStore((s) => s.userName);
  const [businessType, setBusinessType] = useState("");
  const [category, setCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPersonName, setBusinessPersonName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessSignature, setBusinessSignature] = useState("");
  const [businessLogo, setBusinessLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        if (!userEmail || !userName) {
          const profile = await getCurrentUser();
          if (!active) return;
          setBusinessEmail(profile.email || "");
          setBusinessPersonName(profile.name || "");
        } else {
          setBusinessEmail(userEmail);
          setBusinessPersonName(userName);
        }
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err, "Unable to load profile"));
      } finally {
        if (active) setPageLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [router, userEmail, userId, userName]);

  const handleSubmit = async () => {
    if (!userId) {
      setError("Missing user session");
      return;
    }
    if (
      !businessType ||
      !category ||
      !businessName ||
      !businessEmail ||
      !businessPersonName ||
      !businessPhone ||
      !businessAddress ||
      !businessDescription
    ) {
      setError("Please fill all required business details");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createBusiness({
        userId,
        businessName,
        businessEmail,
        businessType,
        businessCategory: category,
        businessPersonName,
        businessAddress,
        businessDescription,
        businessPhone,
        businessSignature,
        businessLogo,
      });
      router.replace(RouteName.dashboard);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to register business"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-[40%] xl:w-[38%] 2xl:w-[36%] bg-[#668F5B] text-white relative overflow-hidden px-10 py-12">
        <div className="absolute -top-24 -right-10 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col justify-between w-full">
          <div>
            <h1 className="text-5xl font-semibold leading-tight" style={{ fontFamily: "var(--font-poppins)" }}>
              Xtreme-360
            </h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-white/85" style={{ fontFamily: "var(--font-poppins)" }}>
              Set up your business profile once and unlock the full workspace for sales, inventory, and operations.
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <AppAsset
              src={AppImages.logo}
              width={360}
              height={360}
              className="object-contain opacity-80 max-w-[70%] h-auto"
            />
          </div>

          <p className="text-sm text-white/70">Powered by Xtreme Computer</p>
        </div>
      </aside>

      <main className="flex-1 flex items-start justify-center overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="w-full max-w-6xl lg:my-4">
          <div className="bg-white rounded-[28px] shadow-[0_24px_80px_rgba(16,24,40,0.12)] overflow-visible">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-black/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                    Business Details
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
                    Tell us about your business to complete registration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  <span className="material-icons text-[20px]">arrow_back</span>
                  Back
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-8 lg:px-10 py-8 overflow-visible">
              <div className="space-y-5 overflow-visible">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                  <ExpansionSelectionTile
                    title="Business type"
                    items={businessTypes}
                    selectedItem={businessType}
                    onItemSelected={setBusinessType}
                    closeOnSelect
                  />
                  <ExpansionSelectionTile
                    title="Business category"
                    items={categories}
                    selectedItem={category}
                    onItemSelected={setCategory}
                    closeOnSelect
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <AppTextField
                    title="Business Name"
                    hintText="Enter your business name"
                    value={businessName}
                    onChange={setBusinessName}
                  />
                  <AppTextField
                    title="Business Email"
                    hintText="Enter your business email"
                    value={businessEmail}
                    onChange={setBusinessEmail}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <AppTextField
                    title="Mobile Number"
                    hintText="Enter your business phone number"
                    value={businessPhone}
                    onChange={setBusinessPhone}
                  />
                  <AppTextField
                    title="Business Person Name"
                    hintText="Enter business person name"
                    value={businessPersonName}
                    onChange={setBusinessPersonName}
                  />
                </div>

                <AppTextField
                  title="Business Address"
                  hintText="Enter your business address"
                  value={businessAddress}
                  onChange={setBusinessAddress}
                  maxLines={2}
                />

                <AppTextField
                  title="Business Description"
                  hintText="Enter your business description"
                  value={businessDescription}
                  onChange={setBusinessDescription}
                  maxLines={2}
                />

                <AppTextField
                  title="Business Signature"
                  hintText="Optional signature text"
                  value={businessSignature}
                  onChange={setBusinessSignature}
                />

                <div className="pt-4 grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl bg-[#FAFBFD] p-5 border border-black/5">
                    <label className="block text-sm font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                      Business Logo
                    </label>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      Upload a logo for invoices, reports, and header branding.
                    </p>
                    <div className="mt-4">
                      <input
                        id={logoInputId}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setBusinessLogo(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={logoInputId}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[#B7C4B2] bg-white px-4 py-4 cursor-pointer hover:border-[#668F5B] hover:bg-[#F7FBF5] transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#668F5B]/10 text-[#668F5B]">
                            <span className="material-icons text-[22px]">upload</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-black">Choose logo file</span>
                            <span className="block text-xs text-[#6B7280] truncate">
                              {businessLogo ? businessLogo.name : "PNG, JPG or WEBP up to any reasonable size"}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[#668F5B] px-4 py-2 text-sm font-medium text-white">
                          Browse
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setBusinessLogo(null)}
                        disabled={!businessLogo}
                        className="mt-3 text-sm font-medium text-[#668F5B] disabled:text-[#B7C4B2]"
                      >
                        Clear selected file
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FAFBFD] p-5 border border-black/5">
                    <p className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                      Session status
                    </p>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      {pageLoading ? "Loading your session..." : userId ? "Session ready" : "No session found"}
                    </p>
                    {error && (
                      <p className="mt-4 text-sm font-medium text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                        {error}
                      </p>
                    )}
                    <div className="mt-4">
                      <AppButton text="Register Business" isLoading={loading} onClick={handleSubmit} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <p className="text-sm text-[#8A8FA3]">Powered by Xtreme Computer</p>
          </div>
        </div>
      </main>
    </div>
  );
}
