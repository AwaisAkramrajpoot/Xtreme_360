"use client";

import { create } from "zustand";
import {
  createItemCategory,
  getItemCategories,
  type ItemCategoryRecord,
} from "@/services/item-api";
import { createUnit, getUnits, type UnitRecord } from "@/services/unit-api";

/**
 * Single client-side source for item units and categories. Every form that
 * picks a unit or category reads from here, and every create goes through
 * here, so a record added in one form shows up in all the others at once.
 */
type ItemLookupState = {
  units: UnitRecord[];
  categories: ItemCategoryRecord[];
  loadUnits: () => Promise<UnitRecord[]>;
  loadCategories: () => Promise<ItemCategoryRecord[]>;
  addUnit: (payload: { name: string; abbreviation: string }) => Promise<UnitRecord>;
  addCategory: (name: string) => Promise<ItemCategoryRecord>;
  removeCategory: (id: number) => void;
};

const sameName = (a?: string | null, b?: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export const unitDisplayName = (u: UnitRecord) => u.name || u.abbreviation;

export const useItemLookupStore = create<ItemLookupState>((set, get) => ({
  units: [],
  categories: [],

  loadUnits: async () => {
    const units = await getUnits();
    set({ units });
    return units;
  },

  loadCategories: async () => {
    const categories = await getItemCategories();
    set({ categories });
    return categories;
  },

  addUnit: async ({ name, abbreviation }) => {
    const trimmed = name.trim();
    if (get().units.some((u) => sameName(u.name, trimmed))) {
      throw new Error(`Unit "${trimmed}" already exists`);
    }
    const created = await createUnit({ name: trimmed, abbreviation });
    if (!created?.id) throw new Error("Failed to save unit");
    // Newest first, matching the API's ORDER BY id DESC.
    set((s) => ({ units: [created, ...s.units.filter((u) => u.id !== created.id)] }));
    return created;
  },

  addCategory: async (name) => {
    const trimmed = name.trim();
    if (get().categories.some((c) => sameName(c.name, trimmed))) {
      throw new Error(`Category "${trimmed}" already exists`);
    }
    const created = await createItemCategory(trimmed);
    if (!created?.id) throw new Error("Failed to save category");
    set((s) => ({ categories: [created, ...s.categories.filter((c) => c.id !== created.id)] }));
    return created;
  },

  removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
}));
