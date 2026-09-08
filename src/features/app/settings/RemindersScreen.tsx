"use client";

import { useState } from "react";
import { AppAppBar } from "@/components/ui/AppAppBar";
import { AppSwitch } from "@/components/ui/AppSwitch";
import { AppColors } from "@/constants/colors";

function SectionCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-md border" style={{ borderColor: AppColors.lightGrey }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        style={{ backgroundColor: AppColors.primary }}
      >
        <span className="text-sm text-white">{title}</span>
        <span className="material-icons text-white">
          {open ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>
      {open && <div className="space-y-2 bg-white p-2">{children}</div>}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-md px-3" style={{ backgroundColor: AppColors.bgColor2 }}>
      <span className="text-xs text-black">{label}</span>
      <AppSwitch value={value} onChange={onChange} />
    </div>
  );
}

function CounterRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-md px-3" style={{ backgroundColor: AppColors.bgColor2 }}>
      <span className="text-xs text-black">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="text-base" style={{ color: AppColors.primary }}>-</button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(9, value + 1))} className="text-base" style={{ color: AppColors.primary }}>+</button>
      </div>
    </div>
  );
}

function ArrowRow({ label, value }: { label: string; value?: string }) {
  return (
    <button type="button" className="flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left" style={{ backgroundColor: AppColors.bgColor2 }}>
      <span className="text-xs text-black">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs" style={{ color: AppColors.grey }}>{value}</span>}
        <span className="material-icons text-black">chevron_right</span>
      </div>
    </button>
  );
}

export function RemindersScreen() {
  const [selfReminder, setSelfReminder] = useState(false);
  const [daysBefore, setDaysBefore] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppAppBar title="Reminders" showBack showSearch />
      <div className="flex-1 overflow-auto px-2 pb-4 pt-2 sm:px-3">
        <div className="space-y-2">
          <SectionCard title="Payment Reminder">
            <ToggleRow label="Self Payment Reminder" value={selfReminder} onChange={setSelfReminder} />
            <CounterRow label="Remind me for payment due more than" value={daysBefore} onChange={setDaysBefore} />
            <ArrowRow label="Self Payment Reminder" value="Once a Day" />
          </SectionCard>

          <SectionCard title="Payment Reminder For party">
            <ArrowRow label="Reminder message to party" />
          </SectionCard>

          <SectionCard title="Service Reminders">
            <div className="rounded-md p-3" style={{ backgroundColor: AppColors.bgColor2 }}>
              <p className="text-xs font-semibold text-black">Benefit of Service Rrminders:</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="mx-auto h-7 w-7 rounded-md bg-[#E8E8E8]" />
                  <p className="mt-1 text-[10px]" style={{ color: AppColors.grey }}>Remind your Parties</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-7 w-7 rounded-md bg-[#E8E8E8]" />
                  <p className="mt-1 text-[10px]" style={{ color: AppColors.grey }}>Don&apos;t lose customers</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto h-7 w-7 rounded-md bg-[#E8E8E8]" />
                  <p className="mt-1 text-[10px]" style={{ color: AppColors.grey }}>Grow your business</p>
                </div>
              </div>

              <button
                type="button"
                className="mt-3 flex w-full items-center justify-between rounded-md bg-[#111] px-2 py-1.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="material-icons text-[#7AC65E]">play_circle</span>
                  <span className="text-[11px] text-white">How does Service Reminders work in Xtreme 360 ?</span>
                </div>
                <span className="text-[11px] text-[#7AC65E]">Watch Video</span>
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

