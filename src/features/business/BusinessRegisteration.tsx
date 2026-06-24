"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextField } from "@/components/ui/AppTextField";
import { ExpansionSelectionTile } from "@/components/ui/ExpansionSelectionTile";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { RouteName } from "@/constants/routes";

const businessTypes = ["Retail", "Distribution", "Whole Sale"];
const categories = [
  "Other", "Food", "Restaurant", "Bakery", "Crockery", "Dairy", "Poultry",
  "Banquet", "Catering", "Kitchen", "Pak wan Center", "Motor Parts",
];

export function BusinessRegisteration() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthSplitLayout
      title="Business Details"
      subtitle="Tell us about your business to complete registration."
      showBack
    >
      <div className="space-y-4">
        <ExpansionSelectionTile title="Business type" items={businessTypes} selectedItem={businessType} onItemSelected={setBusinessType} closeOnSelect />
        <ExpansionSelectionTile title="Business Category" items={categories} selectedItem={category} onItemSelected={setCategory} closeOnSelect />
        <AppTextField title="Business Name" hintText="Enter your business name" />
        <AppTextField title="Business Email" hintText="Enter your business email" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppTextField title="Mobile Number" hintText="Enter your business phoneNumber" />
          <AppTextField title="Business Person Name" hintText="Enter business person name" />
        </div>
        <AppTextField title="Business Address" hintText="Enter your business address" maxLines={2} />
        <AppTextField title="Business Description" hintText="Enter your business description" maxLines={2} />
        <AppButton
          text="Register Business"
          isLoading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => router.replace(RouteName.bottomBar), 800);
          }}
        />
      </div>
    </AuthSplitLayout>
  );
}
