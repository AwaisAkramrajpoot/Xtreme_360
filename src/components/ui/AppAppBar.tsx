"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppColors } from "@/constants/colors";
import { AppAsset } from "./AppAsset";
import { AppImages } from "@/constants/images";
import { useLayoutContext } from "@/components/layout/LayoutContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSessionProfileStore } from "@/stores/session-profile-store";

interface AppAppBarProps {
  title: string;
  showNotification?: boolean;
  showAvatar?: boolean;
  showSearch?: boolean;
  showBack?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function AppAppBar({
  title,
  showNotification,
  showAvatar,
  showSearch,
  showBack,
  actions,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
}: AppAppBarProps) {
  const router = useRouter();
  const { isDashboardShell } = useLayoutContext();
  const user = useSessionProfileStore((s) => s.user);
  const avatarSrc = user?.profile_image ?? AppImages.staticUser;
  const [searchOpen, setSearchOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resolvedSearch = searchValue ?? internalSearch;
  const resolvedShowBack = showBack ?? true;

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
      <PageHeader
        title={title}
        showNotification={showNotification}
        showAvatar={showAvatar}
        showSearch={showSearch}
        showBack={resolvedShowBack}
        actions={actions}
        subtitle={subtitle}
        searchValue={resolvedSearch}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
      />
    );
  }

  return (
    <header
      className="flex items-center justify-between h-14 px-4 bg-white shrink-0 border-b lg:border-none"
      style={{ fontFamily: "var(--font-poppins)", borderColor: AppColors.lightGrey }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {resolvedShowBack && (
          <button type="button" onClick={() => router.back()} className="p-1 -ml-1">
            <span className="material-icons text-black">arrow_back</span>
          </button>
        )}
        <h1 className="text-xl lg:text-2xl font-bold text-black truncate">{title}</h1>
      </div>
      <div className="flex items-center shrink-0">
        {actions}
        {showAvatar && (
          <AppAsset
            src={avatarSrc}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        )}
        {showSearch && (
          <div className="ml-3 flex items-center">
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
                className="rounded-lg p-2 hover:bg-black/5"
                aria-label="Open search"
              >
                <AppAsset src={AppImages.search} width={24} height={24} />
              </button>
            )}
          </div>
        )}
        {showNotification && (
          <div className="ml-3">
            <AppAsset src={AppImages.bell} width={24} height={24} />
          </div>
        )}
        <div className="w-4" />
      </div>
    </header>
  );
}
