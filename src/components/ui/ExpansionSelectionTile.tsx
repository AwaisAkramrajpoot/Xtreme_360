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
}

export function ExpansionSelectionTile({
  title,
  items,
  widgetItems,
  selectedItem: externalSelected,
  onItemSelected,
  closeOnSelect = false,
  defaultExpanded = true,
}: ExpansionSelectionTileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedItem, setSelectedItem] = useState(externalSelected ?? "");

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: AppColors.primary,
          borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-poppins)" }}>
            {title}
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
          className="w-full py-4 bg-white"
          style={{
            border: `1px solid rgba(140, 140, 161, 0.3)`,
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 4px 4px rgba(140, 140, 161, 0.1)",
          }}
        >
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
      )}
    </div>
  );
}
