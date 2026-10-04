"use client";

import { create } from "zustand";

type LoadingState = {
  count: number;
  message: string | null;
  show: (message?: string) => void;
  hide: () => void;
  reset: () => void;
};

export const useLoadingStore = create<LoadingState>((set, get) => ({
  count: 0,
  message: null,
  show: (message) => set({ count: get().count + 1, message: message ?? get().message }),
  hide: () =>
    set((state) => ({
      count: Math.max(0, state.count - 1),
      message: Math.max(0, state.count - 1) === 0 ? null : state.message,
    })),
  reset: () => set({ count: 0, message: null }),
}));
