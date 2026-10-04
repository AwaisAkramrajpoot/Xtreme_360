"use client";

import { createContext, useCallback, useContext, useEffect, useId, useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppColors } from "@/constants/colors";
import type { AppSettingsBundle, SettingsSectionKey } from "@/constants/app-settings";
import { useToast, type ToastVariant } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settings-store";
import { getApiErrorMessage } from "@/utils/api-error";

/* ------------------------------------------------------------------ */
/* Context: search query, readiness and feedback shared by every row   */
/* ------------------------------------------------------------------ */

type SettingsScreenContextValue = {
  query: string;
  ready: boolean;
  notify: (message: string, variant?: ToastVariant) => void;
};

const SettingsScreenContext = createContext<SettingsScreenContextValue>({
  query: "",
  ready: true,
  notify: () => undefined,
});

export function useSettingsScreen() {
  return useContext(SettingsScreenContext);
}

function matchesQuery(query: string, ...texts: Array<string | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return texts.some((text) => text?.toLowerCase().includes(q));
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/** Tracks which setting keys are currently saving. */
export function useBusyKeys() {
  const [busy, setBusy] = useState<Record<string, number>>({});
  const run = useCallback(async <T,>(key: string, task: () => Promise<T>) => {
    setBusy((b) => ({ ...b, [key]: (b[key] || 0) + 1 }));
    try {
      return await task();
    } finally {
      setBusy((b) => {
        const next = { ...b };
        next[key] = (next[key] || 1) - 1;
        if (next[key] <= 0) delete next[key];
        return next;
      });
    }
  }, []);
  const isBusy = useCallback((key: string) => Boolean(busy[key]), [busy]);
  return { run, isBusy };
}

/**
 * Binds a settings_json section to the UI: returns the current values and an `update`
 * that saves optimistically, shows a spinner on the row, and reports success or failure.
 */
export function useSettingsSection<S extends SettingsSectionKey>(section: S) {
  const values = useSettingsStore((s) => s.app[section]);
  const patchSection = useSettingsStore((s) => s.patchSection);
  const { notify } = useSettingsScreen();
  const { run, isBusy } = useBusyKeys();

  const update = useCallback(
    async <K extends keyof AppSettingsBundle[S]>(key: K, value: AppSettingsBundle[S][K]) => {
      try {
        await run(String(key), () =>
          patchSection(section, { [key]: value } as unknown as Partial<AppSettingsBundle[S]>)
        );
        notify("Setting saved");
      } catch (error) {
        notify(getApiErrorMessage(error, "Couldn't save setting. Please try again."), "error");
      }
    },
    [notify, patchSection, run, section]
  );

  return { values, update, isBusy: (key: keyof AppSettingsBundle[S]) => isBusy(String(key)) };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function SettingsLayout({
  title,
  children,
  toolbar,
}: {
  title: string;
  children: React.ReactNode;
  /** Optional content pinned above the sections (e.g. a segmented control). */
  toolbar?: React.ReactNode;
}) {
  const loaded = useSettingsStore((s) => s.loaded);
  const loading = useSettingsStore((s) => s.loading);
  const error = useSettingsStore((s) => s.error);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const { showToast, Toast } = useToast();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loaded) loadSettings().catch(() => undefined);
  }, [loaded, loadSettings]);

  const searching = query.trim().length > 0;

  return (
    <SettingsScreenContext.Provider value={{ query, ready: loaded, notify: showToast }}>
      <div className="flex w-full flex-col">
        <AppAppBar
          title={title}
          showBack
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search settings"
        />

        <div className="w-full max-w-5xl flex-1 space-y-3 pb-10">
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "#F2C2C2", backgroundColor: "#FDF1F1", color: "#8A2B2B" }}
            >
              <span className="flex items-center gap-2">
                <span className="material-icons" style={{ fontSize: 18 }}>error_outline</span>
                Couldn&apos;t load your saved settings. Defaults are shown.
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadSettings({ force: true })}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: AppColors.primary }}
              >
                {loading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {toolbar}

          {!loaded ? (
            <SettingsSkeleton />
          ) : (
            <div className="settings-list space-y-3" data-searching={searching || undefined}>
              {children}
              {searching && (
                <p className="settings-empty py-10 text-center text-sm" style={{ color: AppColors.grey }}>
                  No settings match &ldquo;{query.trim()}&rdquo;.
                </p>
              )}
            </div>
          )}
        </div>
        {Toast}
      </div>
    </SettingsScreenContext.Provider>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading settings">
      {[0, 1].map((card) => (
        <div key={card} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: AppColors.lightGrey }}>
          <div className="h-12 animate-pulse bg-[#F0F1F3]" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 border-t px-4 py-3.5" style={{ borderColor: "#F0F0F0" }}>
              <div className="h-3.5 w-2/5 animate-pulse rounded bg-[#ECEDEF]" />
              <div className="h-7 w-12 animate-pulse rounded-full bg-[#ECEDEF]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icon tile                                                           */
/* ------------------------------------------------------------------ */

/**
 * Tinted square with a centred Material icon. The global `.material-icons` rule sets
 * display/font-size outside Tailwind layers, so centring and sizing live on the wrapper
 * and inline style rather than on the icon span itself.
 */
export function SettingsIcon({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const box = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <span
      aria-hidden
      className={`flex ${box} shrink-0 items-center justify-center rounded-xl`}
      style={{ backgroundColor: "#EAF2EA", color: AppColors.primary }}
    >
      <span className="material-icons" style={{ fontSize: size === "lg" ? 22 : 20 }}>
        {name}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

export function SettingsSection({
  title,
  icon,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { query } = useSettingsScreen();
  const expanded = open || query.trim().length > 0;
  const bodyId = useId();

  return (
    <section
      className="settings-section overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      style={{ borderColor: AppColors.lightGrey }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFA]"
      >
        {icon && <SettingsIcon name={icon} />}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-black" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs" style={{ color: AppColors.grey }}>
              {description}
            </span>
          )}
        </span>
        <span className="material-icons shrink-0" style={{ color: AppColors.grey, fontSize: 22 }}>
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {expanded && (
        <div id={bodyId} className="divide-y border-t" style={{ borderColor: "#F0F0F0" }}>
          {children}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

function RowShell({
  label,
  description,
  htmlFor,
  trailing,
  onClick,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  trailing: React.ReactNode;
  onClick?: () => void;
}) {
  const { query } = useSettingsScreen();
  if (!matchesQuery(query, label, description)) return null;

  const text = (
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-black" style={{ fontFamily: "var(--font-poppins)" }}>
        {label}
      </span>
      {description && (
        <span className="mt-0.5 block text-xs leading-snug" style={{ color: AppColors.grey }}>
          {description}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        data-settings-row
        onClick={onClick}
        className="flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#FAFBFA]"
        style={{ borderColor: "#F0F0F0" }}
      >
        {text}
        {trailing}
      </button>
    );
  }

  return (
    <div data-settings-row className="flex min-h-14 items-center gap-4 px-4 py-3" style={{ borderColor: "#F0F0F0" }}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="min-w-0 flex-1 cursor-pointer">
          {text}
        </label>
      ) : (
        text
      )}
      {trailing}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
      style={{ borderColor: AppColors.primary, borderTopColor: "transparent" }}
    />
  );
}

export function SettingsToggleRow({
  label,
  description,
  value,
  onChange,
  busy,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const { ready } = useSettingsScreen();
  return (
    <RowShell
      label={label}
      description={description}
      htmlFor={id}
      trailing={
        <span className="flex shrink-0 items-center gap-2">
          {busy && <Spinner />}
          <AppSwitch id={id} value={value} onChange={onChange} disabled={disabled || busy || !ready} />
        </span>
      }
    />
  );
}

export function SettingsStepperRow({
  label,
  description,
  value,
  min = 0,
  max = 99,
  suffix,
  onChange,
  busy,
  disabled,
}: {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const { ready } = useSettingsScreen();
  const locked = disabled || busy || !ready;
  return (
    <RowShell
      label={label}
      description={description}
      trailing={
        <span className="flex shrink-0 items-center gap-2">
          {busy && <Spinner />}
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            disabled={locked || value <= min}
            onClick={() => onChange(Math.max(min, value - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border text-lg transition-colors hover:bg-[#F4F4F4] disabled:opacity-40"
            style={{ borderColor: AppColors.lightGrey }}
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
            {value}
            {suffix ? <span className="ml-0.5 text-xs font-normal">{suffix}</span> : null}
          </span>
          <button
            type="button"
            aria-label={`Increase ${label}`}
            disabled={locked || value >= max}
            onClick={() => onChange(Math.min(max, value + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: AppColors.primary }}
          >
            +
          </button>
        </span>
      }
    />
  );
}

export function SettingsSelectRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  busy,
  disabled,
}: {
  label: string;
  description?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const { ready } = useSettingsScreen();
  return (
    <RowShell
      label={label}
      description={description}
      htmlFor={id}
      trailing={
        <span className="flex shrink-0 items-center gap-2">
          {busy && <Spinner />}
          <select
            id={id}
            value={value}
            disabled={disabled || busy || !ready}
            onChange={(e) => onChange(e.target.value as T)}
            className="h-9 max-w-[180px] rounded-lg border bg-white px-2.5 text-sm outline-none transition-colors focus:border-[#588157] disabled:opacity-60"
            style={{ borderColor: AppColors.lightGrey }}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </span>
      }
    />
  );
}

export function SettingsLinkRow({
  label,
  description,
  value,
  onClick,
}: {
  label: string;
  description?: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <RowShell
      label={label}
      description={description}
      onClick={onClick}
      trailing={
        <span className="flex shrink-0 items-center gap-1">
          {value && (
            <span className="max-w-[160px] truncate text-xs" style={{ color: AppColors.grey }}>
              {value}
            </span>
          )}
          <span className="material-icons" style={{ color: AppColors.grey, fontSize: 20 }}>
            chevron_right
          </span>
        </span>
      }
    />
  );
}

/** Explanatory text inside a section; hidden while searching. */
export function SettingsNote({ children }: { children: React.ReactNode }) {
  const { query } = useSettingsScreen();
  if (query.trim()) return null;
  return (
    <p className="px-4 py-3 text-xs leading-relaxed" style={{ color: AppColors.grey, borderColor: "#F0F0F0" }}>
      {children}
    </p>
  );
}

export function SettingsSegmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid rounded-xl border bg-white p-1"
      style={{ borderColor: AppColors.lightGrey, gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className="rounded-lg py-2 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: active ? AppColors.primary : "transparent",
              color: active ? AppColors.white : AppColors.black,
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
