import { create } from "zustand";
import { AppImages } from "@/constants/images";

export interface BottomBarItem {
  label: string;
  icon: string;
}

export const bottomBarItems: BottomBarItem[] = [
  { label: "Home", icon: AppImages.home },
  { label: "Profile", icon: AppImages.profile },
  { label: "Quick Menu", icon: AppImages.quickMenu },
  { label: "Reports", icon: AppImages.reports },
  { label: "Main Menu", icon: AppImages.mainMenu },
];

interface BottomBarState {
  currentIndex: number;
  setIndex: (index: number) => void;
}

export const useBottomBarStore = create<BottomBarState>((set) => ({
  currentIndex: 0,
  setIndex: (currentIndex) => set({ currentIndex }),
}));
