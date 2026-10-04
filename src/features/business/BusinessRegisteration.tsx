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
import { useSessionProfileStore } from "@/stores/session-profile-store";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,19}$/;
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

type FieldKey =
  | "businessType"
  | "category"
  | "businessName"
  | "businessEmail"
  | "businessPhone"
  | "businessPersonName"
  | "businessAddress"
  | "businessDescription"
  | "businessLogo";

type FieldErrors = Partial<Record<FieldKey, string>>;

function omit(errors: FieldErrors, key: FieldKey): FieldErrors {
  const next = { ...errors };
  delete next[key];
  return next;
}

/** Same rules as POST /businesses/:id, so problems are caught before submitting. */
function validateBusiness(values: Record<Exclude<FieldKey, "businessLogo">, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.businessType) errors.businessType = "Select a business type";
  if (!values.category) errors.category = "Select a business category";
  if (!values.businessName.trim()) errors.businessName = "Business name is required";
  if (!values.businessEmail.trim()) errors.businessEmail = "Business email is required";
  else if (!EMAIL_RE.test(values.businessEmail.trim())) errors.businessEmail = "Enter a valid email address";
  if (!values.businessPhone.trim()) errors.businessPhone = "Mobile number is required";
  else if (!PHONE_RE.test(values.businessPhone.trim())) errors.businessPhone = "Enter a valid mobile number";
  if (!values.businessPersonName.trim()) errors.businessPersonName = "Business person name is required";
  if (!values.businessAddress.trim()) errors.businessAddress = "Business address is required";
  if (!values.businessDescription.trim()) errors.businessDescription = "Business description is required";
  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /** Wraps a setter so editing a field clears its error. */
  const bind = (key: FieldKey, setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (fieldErrors[key]) {
      setFieldErrors((e) => omit(e, key));
    }
  };

  const onLogoSelected = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      setFieldErrors((e) => ({ ...e, businessLogo: "Logo must be an image (PNG, JPG or WEBP)" }));
      return;
    }
    if (file && file.size > MAX_LOGO_SIZE) {
      setFieldErrors((e) => ({ ...e, businessLogo: "Logo must be 5 MB or smaller" }));
      return;
    }
    setFieldErrors((e) => omit(e, "businessLogo"));
    setBusinessLogo(file);
  };

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
    const errors = validateBusiness({
      businessType,
      category,
      businessName,
      businessEmail,
      businessPhone,
      businessPersonName,
      businessAddress,
      businessDescription,
    });
    if (fieldErrors.businessLogo) errors.businessLogo = fieldErrors.businessLogo;
    setFieldErrors(errors);
    const count = Object.keys(errors).length;
    if (count) {
      setError(count === 1 ? "Please fix the highlighted field" : `Please fix the ${count} highlighted fields`);
      // Bring the first problem into view once the error styles have rendered.
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"], [data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
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
      // Drop the cached "no business" profile so the dashboard loads the new business.
      useSessionProfileStore.getState().clearSessionProfile();
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
                    Tell us about your business to complete registration. Fields marked{" "}
                    <span className="text-red-500">*</span> are required.
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
                    onItemSelected={bind("businessType", setBusinessType)}
                    closeOnSelect
                    required
                    error={fieldErrors.businessType}
                  />
                  <ExpansionSelectionTile
                    title="Business category"
                    items={categories}
                    selectedItem={category}
                    onItemSelected={bind("category", setCategory)}
                    closeOnSelect
                    required
                    error={fieldErrors.category}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <AppTextField
                    title="Business Name"
                    hintText="Enter your business name"
                    value={businessName}
                    onChange={bind("businessName", setBusinessName)}
                    required
                    error={fieldErrors.businessName}
                  />
                  <AppTextField
                    title="Business Email"
                    hintText="Enter your business email"
                    value={businessEmail}
                    onChange={bind("businessEmail", setBusinessEmail)}
                    type="email"
                    required
                    error={fieldErrors.businessEmail}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <AppTextField
                    title="Mobile Number"
                    hintText="Enter your business phone number"
                    value={businessPhone}
                    onChange={bind("businessPhone", setBusinessPhone)}
                    type="tel"
                    required
                    error={fieldErrors.businessPhone}
                  />
                  <AppTextField
                    title="Business Person Name"
                    hintText="Enter business person name"
                    value={businessPersonName}
                    onChange={bind("businessPersonName", setBusinessPersonName)}
                    required
                    error={fieldErrors.businessPersonName}
                  />
                </div>

                <AppTextField
                  title="Business Address"
                  hintText="Enter your business address"
                  value={businessAddress}
                  onChange={bind("businessAddress", setBusinessAddress)}
                  required
                  error={fieldErrors.businessAddress}
                  maxLines={2}
                />

                <AppTextField
                  title="Business Description"
                  hintText="Enter your business description"
                  value={businessDescription}
                  onChange={bind("businessDescription", setBusinessDescription)}
                  required
                  error={fieldErrors.businessDescription}
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
                        onChange={(e) => {
                        onLogoSelected(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                        className="sr-only"
                      />
                      <label
                        htmlFor={logoInputId}
                        data-invalid={fieldErrors.businessLogo ? true : undefined}
                        className={`flex items-center justify-between gap-4 rounded-2xl border border-dashed bg-white px-4 py-4 cursor-pointer hover:border-[#668F5B] hover:bg-[#F7FBF5] transition-colors ${
                          fieldErrors.businessLogo ? "border-red-500" : "border-[#B7C4B2]"
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#668F5B]/10 text-[#668F5B]">
                            <span className="material-icons text-[22px]">upload</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-black">Choose logo file</span>
                            <span className="block text-xs text-[#6B7280] truncate">
                              {businessLogo ? businessLogo.name : "Optional · PNG, JPG or WEBP up to 5 MB"}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-[#668F5B] px-4 py-2 text-sm font-medium text-white">
                          Browse
                        </span>
                      </label>
                      {fieldErrors.businessLogo && (
                        <p className="mt-1 text-xs text-red-500">{fieldErrors.businessLogo}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => onLogoSelected(null)}
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
