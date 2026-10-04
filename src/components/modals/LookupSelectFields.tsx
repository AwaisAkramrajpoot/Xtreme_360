"use client";

import { useEffect, useMemo, useState } from "react";
import { AppDropDown } from "@/components/ui/AppDropDown";
import { AddCategoryModal, AddUnitModal } from "@/components/modals/AddSimpleModals";
import { unitDisplayName, useItemLookupStore } from "@/stores/item-lookup-store";

type LookupFieldProps = {
  title: string;
  hintText: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

const uniqueNames = (names: string[]) => Array.from(new Set(names.filter(Boolean)));

/** Unit picker backed by the shared unit list, with "Add New Unit" inline. */
export function UnitSelectField({ title, hintText, value, onChange }: LookupFieldProps) {
  const units = useItemLookupStore((s) => s.units);
  const loadUnits = useItemLookupStore((s) => s.loadUnits);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Refresh on every form open so records added elsewhere are picked up.
    loadUnits().catch(() => undefined);
  }, [loadUnits]);

  const names = useMemo(() => uniqueNames(units.map(unitDisplayName)), [units]);

  return (
    <>
      <AppDropDown
        title={title}
        items={names}
        value={value}
        onChange={onChange}
        hintText={hintText}
        emptyText="No units yet"
        actionLabel="Add New Unit"
        onAction={() => setAdding(true)}
      />
      <AddUnitModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(unit) => onChange(unitDisplayName(unit))}
      />
    </>
  );
}

/** Category picker backed by the shared category list, with "Add New Category" inline. */
export function CategorySelectField({ title, hintText, value, onChange }: LookupFieldProps) {
  const categories = useItemLookupStore((s) => s.categories);
  const loadCategories = useItemLookupStore((s) => s.loadCategories);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCategories().catch(() => undefined);
  }, [loadCategories]);

  const names = useMemo(() => uniqueNames(categories.map((c) => c.name)), [categories]);

  return (
    <>
      <AppDropDown
        title={title}
        items={names}
        value={value}
        onChange={onChange}
        hintText={hintText}
        emptyText="No categories yet"
        actionLabel="Add New Category"
        onAction={() => setAdding(true)}
      />
      <AddCategoryModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(category) => onChange(category.name)}
      />
    </>
  );
}
