"use client";

import { useEffect, useRef, useState } from "react";
import { useLayoutContext } from "./LayoutContext";
import { usePathname, useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { useSessionProfileStore } from "@/stores/session-profile-store";
import { getParentRoute, shouldShowBack } from "@/constants/route-hierarchy";

interface PageHeaderProps {
  title: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function PageHeader({
  title,
  showAvatar,
  showSearch,
  showBack,
  backHref,
  actions,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
}: PageHeaderProps) {
  const { isDashboardShell } = useLayoutContext();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSessionProfileStore((s) => s.user);
  const avatarSrc = user?.profile_image ?? AppImages.staticUser;
  const [searchOpen, setSearchOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resolvedSearch = searchValue ?? internalSearch;
  const parent = backHref || getParentRoute(pathname || "");
  const resolvedShowBack = showBack ?? shouldShowBack(pathname || "");

  const handleBack = () => {
    if (parent) router.push(parent);
    else router.back();
  };

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const handleSearchChange = (value: string) => {
    if (searchValue === undefined) {
      setInternalSearch(value);
    }
    onSearchChange?.(value);
  };

  if (isDashboardShell) {
    return (
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {resolvedShowBack && (
              <button
                type="button"
                onClick={handleBack}
                className="mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white pl-2 pr-3 text-sm font-semibold text-[#1F2937] shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]"
                style={{ borderColor: AppColors.lightGrey }}
              >
                <span className="material-icons text-[18px]" aria-hidden>
                  arrow_back
                </span>
                Back
              </button>
            )}
            <h1
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-black break-words"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: AppColors.grey }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {actions}
            {showSearch && (
              <div className="flex items-center">
                {searchOpen ? (
                  <div className="flex h-10 items-center rounded-full border bg-white px-3" style={{ borderColor: AppColors.lightGrey }}>
                    <span className="material-icons text-sm" style={{ color: AppColors.grey }}>
                      search
                    </span>
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={resolvedSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="ml-2 w-36 bg-transparent text-sm outline-none sm:w-48"
                    />
                    {resolvedSearch && (
                      <button
                        type="button"
                        onClick={() => handleSearchChange("")}
                        className="ml-2 rounded-full p-1 hover:bg-black/5"
                        aria-label="Clear search"
                      >
                        <span className="material-icons text-sm" style={{ color: AppColors.grey }}>
                          close
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg hover:bg-white transition-colors"
                    aria-label="Open search"
                  >
                    <AppAsset src={AppImages.search} width={20} height={20} />
                  </button>
                )}
              </div>
            )}
            {showAvatar && (
              <AppAsset
                src={avatarSrc}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
