"use client";

import { useState } from "react";
import { AppColors } from "@/constants/colors";

interface ExpansionSelectionTileProps {
  title: string;
  items?: string[];
  widgetItems?: React.ReactNode[];
  selectedItem?: string;
  onItemSelected?: (item: string) => void;
  closeOnSelect?: boolean;
  defaultExpanded?: boolean;
  /** Shows a red asterisk after the title. */
  required?: boolean;
  /** Error message shown under the tile, with a red outline. */
  error?: string;
}

export function ExpansionSelectionTile({
  title,
  items,
  widgetItems,
  selectedItem: externalSelected,
  onItemSelected,
  closeOnSelect = false,
  defaultExpanded = false,
  required,
  error,
}: ExpansionSelectionTileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedItem, setSelectedItem] = useState(externalSelected ?? "");

  return (
    <div className="relative" data-invalid={error ? true : undefined}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="relative z-20 w-full px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: AppColors.primary,
          borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
          boxShadow: error ? "0 0 0 2px #EF4444" : undefined,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
            {required && (
              <span className="ml-0.5 text-[#FFD2D2]" aria-hidden>
                *
              </span>
            )}
          </span>
          {selectedItem && closeOnSelect && (
            <span className="px-2 py-1 text-xs font-medium text-black bg-white rounded truncate">
              {selectedItem}
            </span>
          )}
        </div>
        <span className="material-icons text-white">
          {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>
      {isExpanded && (
        <div
          className="absolute left-0 right-0 top-full z-30 w-full bg-white"
          style={{
            border: `1px solid rgba(140, 140, 161, 0.3)`,
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 4px 4px rgba(140, 140, 161, 0.1)",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          <div className="py-4">
          {widgetItems ??
            items?.map((item) => {
              const isSelected = item === externalSelected || item === selectedItem;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onItemSelected?.(item);
                    setSelectedItem(item);
                    if (closeOnSelect) setIsExpanded(false);
                  }}
                  className="w-full text-left mb-2 px-3 py-2"
                  style={{
                    border: isSelected ? `1px solid ${AppColors.primary}` : "none",
                    borderRadius: 4,
                  }}
                >
                  <span className="text-sm text-black" style={{ fontFamily: "var(--font-poppins)" }}>
                    {item}
                  </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
