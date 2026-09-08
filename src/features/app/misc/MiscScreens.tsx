"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppTextField } from "@/components/ui/AppTextField";
import { AppColors } from "@/constants/colors";
import { AppImages } from "@/constants/images";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { AddFormScreen } from "@/features/app/forms/AddFormScreens";
import { getApiErrorMessage } from "@/utils/api-error";
import { updateBusinessDetails, updateUserProfile } from "@/services/session-api";

const tabs = ["Products", "Services", "Manufacturing", "Categories", "Units"];

type SummaryCard = {
  key: string;
  title: string;
  value: string;
  detail?: string;
  icon: string;
};

function DetailCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
      style={{ borderColor: AppColors.lightGrey }}
    >
      <div className="mb-3">
        <p className="text-base font-bold text-black">{title}</p>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0 last:pb-0"
      style={{ borderColor: AppColors.lightGrey }}
    >
      <span className="text-sm font-medium" style={{ color: AppColors.grey }}>
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm font-semibold text-black">{value}</span>
    </div>
  );
}

function formatMaybeText(value?: string | null, fallback = "Not available") {
  const text = value?.trim();
  return text ? text : fallback;
}

function formatBool(value?: boolean | null) {
  if (value === true) return "Enabled";
  if (value === false) return "Disabled";
  return "Not available";
}

const BUSINESS_TYPES = ["Retail", "Distribution", "Whole Sale"];
const BUSINESS_CATEGORIES = [
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function uniqueOptions(items: string[], current?: string | null) {
  const list = items.slice();
  if (current && !list.includes(current)) {
    list.unshift(current);
  }
  return list;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-3xl border bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)]" style={{ borderColor: AppColors.lightGrey }}>
      <div className="flex items-start justify-between gap-4 rounded-t-3xl px-4 py-3 text-white" style={{ backgroundColor: AppColors.primary }}>
        <div>
          <p className="text-base font-semibold" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>}
        </div>
        <span className="material-icons text-[20px] text-white/90">expand_more</span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function UploadCard({
  title,
  description,
  inputId,
  previewSrc,
  fallbackSrc,
  filename,
  onChange,
  onClear,
}: {
  title: string;
  description: string;
  inputId: string;
  previewSrc?: string | null;
  fallbackSrc?: string | null;
  filename?: string | null;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const imageSrc = previewSrc || fallbackSrc || null;

  return (
    <div className="rounded-3xl border bg-[#FAFBFD] p-4" style={{ borderColor: AppColors.lightGrey }}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-black">{title}</p>
        <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>
          {description}
        </p>
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <label
        htmlFor={inputId}
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white px-4 py-5 text-center transition-colors hover:border-[#7A9B79] hover:bg-[#F7FBF5]"
        style={{ borderColor: "#B7C4B2" }}
      >
        {imageSrc ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-white" style={{ borderColor: AppColors.lightGrey }}>
              <AppAsset src={imageSrc} width={80} height={80} className="h-full w-full object-contain" />
            </div>
            <div className="max-w-full">
              <p className="truncate text-sm font-semibold text-black">{filename || "Selected image"}</p>
              <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>
                Tap to replace the current file
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#E8F1E8" }}>
              <span className="material-icons text-[24px]" style={{ color: AppColors.primary }}>
                upload
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Choose file</p>
              <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>
                PNG, JPG or WEBP
              </p>
            </div>
          </>
        )}
      </label>
      {imageSrc && (
        <button type="button" onClick={onClear} className="mt-3 text-sm font-medium" style={{ color: AppColors.primary }}>
          Clear selected file
        </button>
      )}
    </div>
  );
}

export function CalendarScreen() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Calendar" showNotification showBack />
      <div className="p-4">
        <h2 className="mb-4 text-lg font-bold text-center">{month}</h2>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs" style={{ color: AppColors.grey }}>
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - today.getDay() + 1;
            const isToday = day === today.getDate();
            return (
              <div
                key={i}
                className="aspect-square flex items-center justify-center rounded-full text-sm"
                style={{
                  backgroundColor: isToday ? AppColors.primary : "transparent",
                  color: isToday ? AppColors.white : day > 0 && day <= 31 ? AppColors.black : "transparent",
                }}
              >
                {day > 0 && day <= 31 ? day : ""}
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <p className="mb-2 text-base font-bold">Today's Events</p>
          <div className="rounded-lg p-3" style={{ backgroundColor: AppColors.bgColor2 }}>
            <p className="font-semibold">Team Meeting</p>
            <p className="text-sm" style={{ color: AppColors.grey }}>
              10:00 AM - 11:00 AM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function POSScreen() {
  const categories = ["All", "Beverages", "Snacks", "Electronics"];
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const items = [
    { name: "Coca Cola", price: "Rs. 100", category: "Beverages" },
    { name: "Lays Chips", price: "Rs. 50", category: "Snacks" },
    { name: "USB Cable", price: "Rs. 350", category: "Electronics" },
    { name: "Water Bottle", price: "Rs. 60", category: "Beverages" },
  ];

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        !q || [item.name, item.price, item.category].some((value) => value.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar
        title="POS"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products"
      />
      <div className="flex gap-2 overflow-x-auto px-4 py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: activeCategory === cat ? AppColors.primary : AppColors.bgColor2,
              color: activeCategory === cat ? AppColors.white : AppColors.black,
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto p-4">
        {filteredItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className="rounded-lg p-4 text-left"
            style={{ backgroundColor: AppColors.bgColor2 }}
          >
            <p className="font-bold text-black">{item.name}</p>
            <p className="text-sm" style={{ color: AppColors.primary }}>
              {item.price}
            </p>
          </button>
        ))}
        {filteredItems.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm" style={{ color: AppColors.grey }}>
            No products found.
          </p>
        )}
      </div>
      <div className="border-t p-4" style={{ borderColor: AppColors.lightGrey }}>
        <div className="mb-2 flex justify-between">
          <span>Total Items: 0</span>
          <span className="font-bold">Rs. 0</span>
        </div>
        <button type="button" className="h-12 w-full rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Checkout
        </button>
      </div>
    </div>
  );
}

export function PlansAndPricingScreen() {
  const plans = [
    { name: "Basic", price: "Rs. 999/mo", features: ["5 Users", "Basic Reports", "Email Support"] },
    { name: "Pro", price: "Rs. 2,499/mo", features: ["20 Users", "Advanced Reports", "Priority Support"] },
    { name: "Enterprise", price: "Rs. 4,999/mo", features: ["Unlimited Users", "All Features", "24/7 Support"] },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Plans & Pricing" showBack />
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-xl border p-5" style={{ borderColor: AppColors.lightGrey }}>
            <h3 className="text-xl font-bold text-black">{plan.name}</h3>
            <p className="mt-1 text-lg font-semibold" style={{ color: AppColors.primary }}>
              {plan.price}
            </p>
            <ul className="mt-3 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <span className="material-icons text-base" style={{ color: AppColors.primary }}>
                    check
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button type="button" className="mt-4 h-11 w-full rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserManagementScreen() {
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const [search, setSearch] = useState("");
  const businessList = user?.businesses?.length ? user.businesses : business ? [business] : [];

  const cards = useMemo<SummaryCard[]>(() => {
    const items: SummaryCard[] = [
      {
        key: "account",
        title: user?.name || business?.person_name || "Current Account",
        value: user?.email || business?.email || "No email available",
        detail: user?.phone || business?.mobile_number || "No phone available",
        icon: "person",
      },
      {
        key: "security",
        title: "Security Access",
        value: `Fingerprint: ${formatBool(user?.use_fingerprint)}`,
        detail: `Face recognition: ${formatBool(user?.use_face_recognition)}`,
        icon: "shield",
      },
    ];

    businessList.forEach((item, index) => {
      items.push({
        key: `business-${item.id ?? index}`,
        title: item.name || "Business",
        value: item.type || "Business",
        detail: item.category || item.address || "Business profile",
        icon: "storefront",
      });
    });

    return items;
  }, [
    business?.address,
    business?.email,
    business?.mobile_number,
    business?.person_name,
    business?.type,
    businessList,
    user?.email,
    user?.name,
    user?.phone,
    user?.use_face_recognition,
    user?.use_fingerprint,
  ]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.title, card.value, card.detail, card.key]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [cards, search]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar
        title="User Management"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search account"
      />
      <div className="flex-1 space-y-4 p-5">
        <DetailCard title="Account Overview" subtitle="Current login and linked business profile">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                Name
              </p>
              <p className="mt-1 text-base font-bold text-black">
                {formatMaybeText(user?.name || business?.person_name || null, "Account")}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                Email
              </p>
              <p className="mt-1 text-base font-bold text-black">
                {formatMaybeText(user?.email || business?.email || null, "Not available")}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                Phone
              </p>
              <p className="mt-1 text-base font-bold text-black">
                {formatMaybeText(user?.phone || business?.mobile_number || null, "Not available")}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                Profile Status
              </p>
              <p className="mt-1 text-base font-bold text-black">{user?.is_verified ? "Verified" : "Pending"}</p>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Linked Businesses" subtitle={`${businessList.length} business profile(s)`}>
          <div className="space-y-3">
            {filteredCards.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: AppColors.grey }}>
                No matching account or business found.
              </p>
            ) : (
              filteredCards.map((card) => (
                <div
                  key={card.key}
                  className="flex items-start gap-3 rounded-xl border p-4"
                  style={{ borderColor: AppColors.lightGrey, backgroundColor: AppColors.bgColor2 }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#E8F1E8" }}>
                    <span className="material-icons" style={{ color: AppColors.primary }}>
                      {card.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-black">{card.title}</p>
                    <p className="mt-0.5 text-sm font-medium" style={{ color: AppColors.grey }}>
                      {card.value}
                    </p>
                    {card.detail && <p className="mt-1 text-sm text-black">{card.detail}</p>}
                  </div>
                  <span className="material-icons shrink-0" style={{ color: AppColors.grey }}>
                    more_vert
                  </span>
                </div>
              ))
            )}
          </div>
        </DetailCard>
      </div>
    </div>
  );
}

export function ImportBaseScreen({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title={title} showBack />
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <div
          className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed"
          style={{ borderColor: AppColors.bordercolor }}
        >
          <span className="material-icons text-4xl" style={{ color: AppColors.grey }}>
            upload_file
          </span>
          <p className="text-sm" style={{ color: AppColors.grey }}>
            Click to upload or drag and drop
          </p>
          <p className="text-xs" style={{ color: AppColors.grey }}>
            CSV, XLS, XLSX
          </p>
        </div>
        <div className="h-6" />
        <button type="button" className="h-14 w-full rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Import
        </button>
      </div>
    </div>
  );
}

export function ProfileDetailScreen() {
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const loadSessionProfile = useSessionProfileStore((s) => s.loadSessionProfile);
  const currentBusiness = business ?? user?.businesses?.[0] ?? null;

  const profileImageInputId = useId();
  const businessLogoInputId = useId();

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePin, setProfilePin] = useState("");
  const [profileFingerprint, setProfileFingerprint] = useState(false);
  const [profileFaceRecognition, setProfileFaceRecognition] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessPersonName, setBusinessPersonName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessSignature, setBusinessSignature] = useState("");
  const [businessLogoFile, setBusinessLogoFile] = useState<File | null>(null);
  const [businessLogoPreview, setBusinessLogoPreview] = useState<string | null>(null);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState("");

  const resolvedBusinessTypes = useMemo(() => uniqueOptions(BUSINESS_TYPES, currentBusiness?.type ?? null), [currentBusiness?.type]);
  const resolvedBusinessCategories = useMemo(
    () => uniqueOptions(BUSINESS_CATEGORIES, currentBusiness?.category ?? null),
    [currentBusiness?.category]
  );

  useEffect(() => {
    if (!user && !business) {
      void loadSessionProfile();
    }
  }, [business, loadSessionProfile, user]);

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfilePhone(user?.phone ?? "");
    setProfilePin(user?.pin ?? "");
    setProfileFingerprint(Boolean(user?.use_fingerprint));
    setProfileFaceRecognition(Boolean(user?.use_face_recognition));
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setProfileError("");
  }, [user?.name, user?.phone, user?.pin, user?.use_fingerprint, user?.use_face_recognition, user?.updated_at]);

  useEffect(() => {
    setBusinessName(currentBusiness?.name ?? "");
    setBusinessType(currentBusiness?.type ?? "");
    setBusinessCategory(currentBusiness?.category ?? "");
    setBusinessPersonName(currentBusiness?.person_name ?? "");
    setBusinessPhone(currentBusiness?.mobile_number ?? "");
    setBusinessEmail(currentBusiness?.email ?? user?.email ?? "");
    setBusinessAddress(currentBusiness?.address ?? "");
    setBusinessDescription(currentBusiness?.description ?? "");
    setBusinessSignature(currentBusiness?.business_signature ?? "");
    setBusinessLogoFile(null);
    setBusinessLogoPreview(null);
    setBusinessError("");
  }, [
    currentBusiness?.address,
    currentBusiness?.business_signature,
    currentBusiness?.category,
    currentBusiness?.description,
    currentBusiness?.email,
    currentBusiness?.mobile_number,
    currentBusiness?.name,
    currentBusiness?.person_name,
    currentBusiness?.type,
    currentBusiness?.updated_at,
    user?.email,
  ]);

  useEffect(
    () => () => {
      if (profileImagePreview?.startsWith("blob:")) URL.revokeObjectURL(profileImagePreview);
    },
    [profileImagePreview]
  );

  useEffect(
    () => () => {
      if (businessLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(businessLogoPreview);
    },
    [businessLogoPreview]
  );

  const avatarSrc = profileImagePreview || user?.profile_image || AppImages.staticUser;

  const handleProfileImageChange = (file: File | null) => {
    if (profileImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImagePreview);
    }
    if (!file) {
      setProfileImageFile(null);
      setProfileImagePreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose a valid profile image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setProfileError("Profile image must be 5 MB or smaller.");
      return;
    }
    setProfileError("");
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleBusinessLogoChange = (file: File | null) => {
    if (businessLogoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(businessLogoPreview);
    }
    if (!file) {
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setBusinessError("Please choose a valid business logo.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setBusinessError("Business logo must be 5 MB or smaller.");
      return;
    }
    setBusinessError("");
    setBusinessLogoFile(file);
    setBusinessLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");

    try {
      await updateUserProfile({
        name: profileName,
        phone: profilePhone,
        pin: profilePin,
        useFingerprint: profileFingerprint,
        useFaceRecognition: profileFaceRecognition,
        profileImage: profileImageFile,
      });
      await loadSessionProfile(true);
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (error) {
      setProfileError(getApiErrorMessage(error, "Unable to update profile details"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!currentBusiness?.id) {
      setBusinessError("Business record not found.");
      return;
    }

    setBusinessSaving(true);
    setBusinessError("");

    try {
      await updateBusinessDetails(Number(currentBusiness.id), {
        businessName,
        businessType,
        businessCategory,
        businessPersonName,
        businessPhone,
        businessEmail,
        businessAddress,
        businessDescription,
        businessSignature,
        businessLogo: businessLogoFile,
      });
      await loadSessionProfile(true);
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
    } catch (error) {
      setBusinessError(getApiErrorMessage(error, "Unable to update business details"));
    } finally {
      setBusinessSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <AppAppBar title="Profile Details" showBack showNotification showAvatar />
      <div className="flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <div className="rounded-[30px] border bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.06)]" style={{ borderColor: AppColors.lightGrey }}>
            <div className="flex flex-col items-center gap-3 text-center">
              <label
                htmlFor={profileImageInputId}
                className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                style={{ borderColor: AppColors.primary }}
              >
                <AppAsset src={avatarSrc} width={96} height={96} className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="material-icons text-[28px] text-white">photo_camera</span>
                </span>
              </label>
              <input
                id={profileImageInputId}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => handleProfileImageChange(event.target.files?.[0] ?? null)}
              />
              <div>
                <p className="text-xl font-bold text-black">{formatMaybeText(profileName || user?.name || currentBusiness?.person_name, "Account")}</p>
                <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                  {formatMaybeText(user?.email || currentBusiness?.email, "No email available")}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="rounded-full bg-[#E8F1E8] px-3 py-1" style={{ color: AppColors.primary }}>
                  {user?.is_verified ? "Verified" : "Pending verification"}
                </span>
                {profileImageFile && <span style={{ color: AppColors.grey }}>{profileImageFile.name}</span>}
              </div>
            </div>
          </div>

          <SectionCard title="Profile detail" subtitle="Update your personal details and security preferences">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField title="Person Name" hintText="Enter your name" value={profileName} onChange={setProfileName} />
              <AppTextField title="Mobile number" hintText="Enter your mobile number" value={profilePhone} onChange={setProfilePhone} />
              <AppTextField title="Email Address" hintText="Email" value={user?.email ?? ""} readOnly />
              <AppTextField title="PIN" hintText="Enter PIN" value={profilePin} onChange={setProfilePin} maxLength={6} />
              <AppTextField title="Password" hintText="Managed in authentication" value="********" readOnly />
              <div className="rounded-md bg-[#F0F1F5] p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                  Face recognition & fingerprint
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-black">Fingerprint</p>
                      <p className="text-xs" style={{ color: AppColors.grey }}>
                        Enable login with fingerprint
                      </p>
                    </div>
                    <AppSwitch value={profileFingerprint} onChange={setProfileFingerprint} />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-black">Face recognition</p>
                      <p className="text-xs" style={{ color: AppColors.grey }}>
                        Enable login with face ID
                      </p>
                    </div>
                    <AppSwitch value={profileFaceRecognition} onChange={setProfileFaceRecognition} />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2 rounded-2xl bg-[#F0F1F5] p-4">
                <p className="text-sm font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                  Profile photo
                </p>
                <p className="mt-1 text-xs" style={{ color: AppColors.grey }}>
                  Tap the avatar above to change your image.
                </p>
              </div>
            </div>
            {profileError && <p className="text-sm font-medium text-red-500">{profileError}</p>}
            <div className="pt-1">
              <AppButton text="Update" isLoading={profileSaving} onClick={handleSaveProfile} />
            </div>
          </SectionCard>

          <SectionCard title="Business detail" subtitle="Update your linked business profile from the web">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField title="Business Name" hintText="Enter business name" value={businessName} onChange={setBusinessName} />
              <AppDropDown
                title="Business Type"
                items={resolvedBusinessTypes}
                value={businessType || null}
                onChange={setBusinessType}
                hintText="Select business type"
              />
              <AppDropDown
                title="Business Category"
                items={resolvedBusinessCategories}
                value={businessCategory || null}
                onChange={setBusinessCategory}
                hintText="Select category"
              />
              <AppTextField
                title="Business Person Name"
                hintText="Enter business person name"
                value={businessPersonName}
                onChange={setBusinessPersonName}
              />
              <AppTextField title="Mobile Number" hintText="Enter business phone" value={businessPhone} onChange={setBusinessPhone} />
              <AppTextField title="Email Address" hintText="Enter business email" value={businessEmail} onChange={setBusinessEmail} />
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Address"
                  hintText="Enter business address"
                  value={businessAddress}
                  onChange={setBusinessAddress}
                  maxLines={2}
                />
              </div>
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Description"
                  hintText="Write a short description"
                  value={businessDescription}
                  onChange={setBusinessDescription}
                  maxLines={3}
                />
              </div>
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Signature"
                  hintText="Optional signature text"
                  value={businessSignature}
                  onChange={setBusinessSignature}
                />
              </div>
              <div className="sm:col-span-2">
                <UploadCard
                  title="Business logo"
                  description="Choose a logo after the description section, like a real business profile form."
                  inputId={businessLogoInputId}
                  previewSrc={businessLogoPreview}
                  fallbackSrc={currentBusiness?.business_logo ?? null}
                  filename={businessLogoFile?.name ?? null}
                  onChange={handleBusinessLogoChange}
                  onClear={() => {
                    if (businessLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(businessLogoPreview);
                    setBusinessLogoFile(null);
                    setBusinessLogoPreview(null);
                  }}
                />
              </div>
            </div>
            {businessError && <p className="text-sm font-medium text-red-500">{businessError}</p>}
            <div className="pt-1">
              <AppButton text="Update" isLoading={businessSaving} onClick={handleSaveBusiness} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export function BusinessDetailScreen() {
  const user = useSessionProfileStore((s) => s.user);
  const business = useSessionProfileStore((s) => s.business);
  const loadSessionProfile = useSessionProfileStore((s) => s.loadSessionProfile);
  const currentBusiness = business ?? user?.businesses?.[0] ?? null;
  const businessLogoInputId = useId();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessPersonName, setBusinessPersonName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessSignature, setBusinessSignature] = useState("");
  const [businessLogoFile, setBusinessLogoFile] = useState<File | null>(null);
  const [businessLogoPreview, setBusinessLogoPreview] = useState<string | null>(null);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState("");

  const resolvedBusinessTypes = useMemo(() => uniqueOptions(BUSINESS_TYPES, currentBusiness?.type ?? null), [currentBusiness?.type]);
  const resolvedBusinessCategories = useMemo(
    () => uniqueOptions(BUSINESS_CATEGORIES, currentBusiness?.category ?? null),
    [currentBusiness?.category]
  );

  useEffect(() => {
    if (!user && !business) {
      void loadSessionProfile();
    }
  }, [business, loadSessionProfile, user]);

  useEffect(() => {
    setBusinessName(currentBusiness?.name ?? "");
    setBusinessType(currentBusiness?.type ?? "");
    setBusinessCategory(currentBusiness?.category ?? "");
    setBusinessPersonName(currentBusiness?.person_name ?? "");
    setBusinessPhone(currentBusiness?.mobile_number ?? "");
    setBusinessEmail(currentBusiness?.email ?? user?.email ?? "");
    setBusinessAddress(currentBusiness?.address ?? "");
    setBusinessDescription(currentBusiness?.description ?? "");
    setBusinessSignature(currentBusiness?.business_signature ?? "");
    setBusinessLogoFile(null);
    setBusinessLogoPreview(null);
    setBusinessError("");
  }, [
    currentBusiness?.address,
    currentBusiness?.business_signature,
    currentBusiness?.category,
    currentBusiness?.description,
    currentBusiness?.email,
    currentBusiness?.mobile_number,
    currentBusiness?.name,
    currentBusiness?.person_name,
    currentBusiness?.type,
    currentBusiness?.updated_at,
    user?.email,
  ]);

  useEffect(
    () => () => {
      if (businessLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(businessLogoPreview);
    },
    [businessLogoPreview]
  );

  const handleBusinessLogoChange = (file: File | null) => {
    if (businessLogoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(businessLogoPreview);
    }
    if (!file) {
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setBusinessError("Please choose a valid business logo.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setBusinessError("Business logo must be 5 MB or smaller.");
      return;
    }
    setBusinessError("");
    setBusinessLogoFile(file);
    setBusinessLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveBusiness = async () => {
    if (!currentBusiness?.id) {
      setBusinessError("Business record not found.");
      return;
    }

    setBusinessSaving(true);
    setBusinessError("");

    try {
      await updateBusinessDetails(Number(currentBusiness.id), {
        businessName,
        businessType,
        businessCategory,
        businessPersonName,
        businessPhone,
        businessEmail,
        businessAddress,
        businessDescription,
        businessSignature,
        businessLogo: businessLogoFile,
      });
      await loadSessionProfile(true);
      setBusinessLogoFile(null);
      setBusinessLogoPreview(null);
    } catch (error) {
      setBusinessError(getApiErrorMessage(error, "Unable to update business details"));
    } finally {
      setBusinessSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <AppAppBar title="Business Details" showBack showNotification />
      <div className="flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <div className="rounded-[30px] border bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.06)]" style={{ borderColor: AppColors.lightGrey }}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "#E8F1E8" }}>
                <span className="material-icons text-[32px]" style={{ color: AppColors.primary }}>
                  storefront
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-black">{formatMaybeText(businessName || currentBusiness?.name || "Business")}</p>
                <p className="mt-1 text-sm" style={{ color: AppColors.grey }}>
                  {formatMaybeText(businessEmail || currentBusiness?.email || user?.email, "No email available")}
                </p>
              </div>
            </div>
          </div>

          <SectionCard title="Business detail" subtitle="Update the details shown on your web profile">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppTextField title="Business Name" hintText="Enter business name" value={businessName} onChange={setBusinessName} />
              <AppDropDown
                title="Business Type"
                items={resolvedBusinessTypes}
                value={businessType || null}
                onChange={setBusinessType}
                hintText="Select business type"
              />
              <AppDropDown
                title="Business Category"
                items={resolvedBusinessCategories}
                value={businessCategory || null}
                onChange={setBusinessCategory}
                hintText="Select category"
              />
              <AppTextField
                title="Business Person Name"
                hintText="Enter business person name"
                value={businessPersonName}
                onChange={setBusinessPersonName}
              />
              <AppTextField title="Mobile Number" hintText="Enter business mobile" value={businessPhone} onChange={setBusinessPhone} />
              <AppTextField title="Email Address" hintText="Enter business email" value={businessEmail} onChange={setBusinessEmail} />
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Address"
                  hintText="Enter business address"
                  value={businessAddress}
                  onChange={setBusinessAddress}
                  maxLines={2}
                />
              </div>
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Description"
                  hintText="Enter business description"
                  value={businessDescription}
                  onChange={setBusinessDescription}
                  maxLines={3}
                />
              </div>
              <div className="sm:col-span-2">
                <AppTextField
                  title="Business Signature"
                  hintText="Enter signature text"
                  value={businessSignature}
                  onChange={setBusinessSignature}
                />
              </div>
              <div className="sm:col-span-2">
                <UploadCard
                  title="Business logo"
                  description="The logo field sits below the description, just like the real form flow you asked for."
                  inputId={businessLogoInputId}
                  previewSrc={businessLogoPreview}
                  fallbackSrc={currentBusiness?.business_logo ?? null}
                  filename={businessLogoFile?.name ?? null}
                  onChange={handleBusinessLogoChange}
                  onClear={() => {
                    if (businessLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(businessLogoPreview);
                    setBusinessLogoFile(null);
                    setBusinessLogoPreview(null);
                  }}
                />
              </div>
            </div>
            {businessError && <p className="text-sm font-medium text-red-500">{businessError}</p>}
            <div className="pt-1">
              <AppButton text="Save" isLoading={businessSaving} onClick={handleSaveBusiness} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export function OtherIncomeScreen() {
  const [search, setSearch] = useState("");
  const items = [
    { title: "Rental Income", amount: "Rs. 25,000" },
    { title: "Commission", amount: "Rs. 8,500" },
    { title: "Interest Income", amount: "Rs. 2,200" },
  ];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.title, item.amount].some((value) => value.toLowerCase().includes(q)));
  }, [search]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar
        title="Other Income"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search income"
      />
      <div className="flex-1 p-5">
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.title} className="rounded-lg p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="font-bold">{item.title}</p>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                {item.amount}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm" style={{ color: AppColors.grey }}>
              No income found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecycleBinScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Recycle Bin" showBack />
      <div className="p-5 text-center" style={{ color: AppColors.grey }}>
        <span className="material-icons mb-2 text-5xl">delete_outline</span>
        <p>No deleted items</p>
      </div>
    </div>
  );
}

export function CloseFinancialYearsScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Close Financial Years" showBack />
      <div className="space-y-4 p-5">
        <div className="rounded-lg p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">FY 2024-2025</p>
          <p className="text-sm" style={{ color: AppColors.greenText }}>
            Active
          </p>
        </div>
        <button type="button" className="h-12 w-full rounded text-white font-semibold" style={{ backgroundColor: AppColors.primary }}>
          Close Current Year
        </button>
      </div>
    </div>
  );
}

export function CashInHandScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Cash in Hand" showBack />
      <div className="p-5">
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="text-sm" style={{ color: AppColors.grey }}>
            Current Balance
          </p>
          <p className="mt-2 text-3xl font-bold" style={{ color: AppColors.primary }}>
            Rs. 1,50,000
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoanAmountScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Loan Amount" showBack />
      <div className="p-5">
        <div className="rounded-lg p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">Business Loan</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: AppColors.redText }}>
            Rs. 5,00,000
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChequeScreen() {
  const [tab, setTab] = useState(0);
  const tabs = ["Pending", "Deposited", "Bounced"];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar title="Cheques" showBack />
      <div className="flex border-b" style={{ borderColor: AppColors.lightGrey }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className="flex-1 py-3 text-sm font-semibold"
            style={{
              color: tab === i ? AppColors.primary : AppColors.grey,
              borderBottom: tab === i ? `2px solid ${AppColors.primary}` : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-5">
        <div className="rounded-lg p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
          <p className="font-bold">Cheque #12345</p>
          <p className="text-sm" style={{ color: AppColors.grey }}>
            Rs. 50,000 | Due: 15/01/2024
          </p>
        </div>
      </div>
    </div>
  );
}

export function BankAccountScreen() {
  const [search, setSearch] = useState("");
  const accounts = [
    { name: "HBL - Main Account", account: "****1234", balance: "Rs. 2,00,000" },
    { name: "Meezan - Savings", account: "****9876", balance: "Rs. 45,000" },
  ];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((item) => [item.name, item.account, item.balance].some((value) => value.toLowerCase().includes(q)));
  }, [search]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppAppBar
        title="Bank Account"
        showBack
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search account"
      />
      <div className="flex-1 p-5">
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.name} className="rounded-lg p-4" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="font-bold">{item.name}</p>
              <p className="text-sm" style={{ color: AppColors.grey }}>
                {item.account}
              </p>
              <p className="mt-1 text-lg font-semibold" style={{ color: AppColors.primary }}>
                {item.balance}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm" style={{ color: AppColors.grey }}>
              No bank accounts found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TransferScreen({ title }: { title: string }) {
  return (
    <AddFormScreen
      title={title}
      submitLabel="Transfer"
      fields={[
        { title: "From Account", hintText: "Select account" },
        { title: "To Account", hintText: "Select account" },
        { title: "Amount", hintText: "0.00" },
        { title: "Date", hintText: "dd/mm/yyyy", isDate: true },
        { title: "Description", hintText: "Enter description", maxLines: 2 },
      ]}
    />
  );
}
