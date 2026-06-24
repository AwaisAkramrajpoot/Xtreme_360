"use client";

import { AppColors } from "@/constants/colors";

interface FabProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 md:bottom-8 right-4 sm:right-6 lg:right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 hover:scale-105 transition-transform"
      style={{ backgroundColor: AppColors.primary }}
    >
      <span className="material-icons text-white text-2xl">add</span>
    </button>
  );
}
