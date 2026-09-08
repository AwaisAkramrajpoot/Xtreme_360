"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { AppColors } from "@/constants/colors";
import { formatDate, parseDisplayDate } from "@/utils/helpers";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DatePickerPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  value?: string;
  onSelect: (formatted: string, date: Date) => void;
  onClose: () => void;
}

export function DatePickerPopover({
  anchorEl,
  open,
  value,
  onSelect,
  onClose,
}: DatePickerPopoverProps) {
  const selected = parseDisplayDate(value);
  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = parseDisplayDate(value) ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open || !anchorEl) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const panelWidth = Math.min(300, Math.max(280, rect.width));
      const panelHeight = 340;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < panelHeight && rect.top > spaceBelow;
      const top = openAbove ? rect.top - panelHeight - gap : rect.bottom + gap;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelWidth - 8);
      }
      setPosition({ top: Math.max(8, top), left, width: panelWidth });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorEl]);

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let i = 0; i < startOffset; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(viewYear, viewMonth, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  if (!open || typeof document === "undefined") return null;

  const today = startOfDay(new Date());

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Choose date"
      className="fixed z-[1000] rounded-xl border bg-white p-3 shadow-2xl"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        borderColor: AppColors.lightGrey,
        fontFamily: "var(--font-poppins)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <span className="material-icons text-[20px]" style={{ color: AppColors.greyishBlack }}>
            chevron_left
          </span>
        </button>
        <p className="text-sm font-semibold text-black">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <span className="material-icons text-[20px]" style={{ color: AppColors.greyishBlack }}>
            chevron_right
          </span>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[11px] font-semibold"
            style={{ color: AppColors.grey }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const isSelected = selected ? sameDay(date, selected) : false;
          const isToday = sameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => {
                onSelect(formatDate(date, "dd/MM/yyyy"), date);
                onClose();
              }}
              className={clsx(
                "h-9 rounded-lg text-sm font-medium transition-colors",
                isSelected ? "text-white" : "text-black hover:bg-gray-100"
              )}
              style={{
                backgroundColor: isSelected ? AppColors.primary : "transparent",
                boxShadow: !isSelected && isToday ? `inset 0 0 0 1px ${AppColors.primary}` : undefined,
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: AppColors.lightGrey }}>
        <button
          type="button"
          className="text-xs font-semibold hover:underline"
          style={{ color: AppColors.grey }}
          onClick={() => {
            onSelect("", new Date(0));
            onClose();
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: AppColors.primary }}
          onClick={() => {
            const now = new Date();
            onSelect(formatDate(now, "dd/MM/yyyy"), now);
            onClose();
          }}
        >
          Today
        </button>
      </div>
    </div>,
    document.body
  );
}
