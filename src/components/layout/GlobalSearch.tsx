"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppAsset } from "@/components/ui/AppAsset";
import { AppImages } from "@/constants/images";
import { AppColors } from "@/constants/colors";
import { allSidebarNavItems } from "@/constants/navigation";
import {
  cashBankItems,
  purchaseItems,
  salesItems,
  settingsItems,
  utilitiesItems,
  type MenuItem,
} from "@/constants/menu-data";
import { useRouteEnabled } from "@/hooks/use-route-enabled";

type SearchEntry = { label: string; group: string; href: string };

const fromMenu = (group: string, items: MenuItem[]): SearchEntry[] =>
  items.filter((i) => i.href).map((i) => ({ label: i.title, group, href: i.href as string }));

/** Every navigable page, de-duplicated by URL. */
const SEARCH_INDEX: SearchEntry[] = (() => {
  const all = [
    ...allSidebarNavItems.map((i) => ({ label: i.label, group: "Pages", href: i.href })),
    ...fromMenu("Sales", salesItems),
    ...fromMenu("Purchase", purchaseItems),
    ...fromMenu("Cash & Bank", cashBankItems),
    ...fromMenu("Utilities", utilitiesItems),
    ...fromMenu("Settings", settingsItems),
  ];
  const seen = new Set<string>();
  return all.filter((e) => (seen.has(e.href) ? false : (seen.add(e.href), true)));
})();

/** Header search that jumps to any page by name. */
export function GlobalSearch() {
  const router = useRouter();
  const isEnabled = useRouteEnabled();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (e) => isEnabled(e.href) && (e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, isEnabled]);

  const go = (entry: SearchEntry) => {
    router.push(entry.href);
    setQuery("");
    setOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative hidden sm:block min-w-0 flex-1 max-w-xs lg:max-w-sm xl:max-w-md"
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="flex items-center gap-2 rounded-lg bg-[#F0F1F5] px-3 py-2 focus-within:ring-2 focus-within:ring-[#588157]/40">
        <AppAsset src={AppImages.search} width={18} height={18} className="shrink-0" />
        <input
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          placeholder="Search pages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8C8CA1]"
          style={{ fontFamily: "var(--font-poppins)" }}
        />
      </div>

      {open && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
          style={{ borderColor: AppColors.lightGrey }}
        >
          {results.length ? (
            results.map((entry, index) => (
              <button
                key={entry.href}
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => go(entry)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                style={{ backgroundColor: index === highlight ? "#F1F5F1" : undefined }}
              >
                <span className="truncate font-medium text-black">{entry.label}</span>
                <span className="shrink-0 text-xs" style={{ color: AppColors.grey }}>
                  {entry.group}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm" style={{ color: AppColors.grey }}>
              No pages match &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
