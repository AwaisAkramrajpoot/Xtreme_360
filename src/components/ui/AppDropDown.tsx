"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { AppColors } from "@/constants/colors";

interface AppDropDownProps<T extends string> {
  title?: string;
  items: T[];
  value?: T | null;
  onChange: (value: T) => void;
  hintText?: string;
  getLabel?: (item: T) => string;
}

export function AppDropDown<T extends string>({
  title,
  items,
  value,
  onChange,
  hintText = "Select",
  getLabel = (item) => item,
}: AppDropDownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="w-full">
      {title && (
        <>
          <label className="block text-sm font-semibold text-black mb-1.5" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
          </label>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-12 px-4 flex items-center justify-between rounded-md text-sm text-left"
        style={{
          backgroundColor: AppColors.inputFill,
          fontFamily: "var(--font-poppins)",
          color: value ? AppColors.black : "rgba(100,100,100,0.6)",
        }}
      >
        <span>{value ? getLabel(value) : hintText}</span>
        <span className="material-icons text-lg" style={{ color: AppColors.grey }}>
          {open ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>
      {open && (
        <ul
          className="mt-1 w-full bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          style={{ borderColor: AppColors.lightGrey }}
        >
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={clsx(
                  "w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors",
                  value === item && "font-semibold"
                )}
                style={{
                  color: value === item ? AppColors.primary : AppColors.black,
                  backgroundColor: value === item ? `${AppColors.primary}10` : undefined,
                }}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
              >
                {getLabel(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
