"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppColors } from "@/constants/colors";
import { RouteName } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { IntroStepLayout } from "@/components/layout/IntroStepLayout";

const languages = [
  { flag: "🇺🇸", name: "English", native: "English", code: "en" },
  { flag: "🇵🇰", name: "Urdu", native: "اردو", code: "ur" },
];

function LanguageCard({
  flag,
  name,
  native,
  selected,
  onSelect,
}: {
  flag: string;
  name: string;
  native: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all duration-200 hover:shadow-sm"
      style={{
        border: selected ? `2px solid ${AppColors.primary}` : `1px solid ${AppColors.lightGrey}`,
        boxShadow: selected ? "0 2px 12px rgba(88, 129, 87, 0.12)" : "none",
        backgroundColor: selected ? `${AppColors.primary}08` : AppColors.white,
      }}
    >
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white"
        style={{ border: `1px solid ${AppColors.lightGrey}` }}
      >
        {flag}
      </span>
      <span
        className="flex-1 text-left text-base font-semibold text-black"
        style={{ fontFamily: "var(--font-poppins)" }}
      >
        {name}
      </span>
      <span className="text-xs sm:inline hidden" style={{ color: AppColors.grey }}>
        ({native})
      </span>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: selected ? AppColors.primary : "transparent",
          border: selected ? "none" : `2px solid ${AppColors.lightGrey}`,
        }}
      >
        {selected && <span className="material-icons text-white text-base">check</span>}
      </span>
    </button>
  );
}

export function LanguageSelectionScreen() {
  const router = useRouter();
  const { language, setLanguage } = useAuthStore();
  const [selected, setSelected] = useState(language || "ur");
  const [loading, setLoading] = useState(false);

  return (
    <IntroStepLayout
      title="Choose your language"
      footer={
        <AppButton
          text="Next"
          isLoading={loading}
          onClick={async () => {
            setLoading(true);
            setLanguage(selected);
            await new Promise((r) => setTimeout(r, 500));
            router.push(RouteName.onBoarding);
          }}
        />
      }
    >
      <p className="text-sm text-center mb-6" style={{ color: AppColors.grey }}>
        Select your preferred language to continue
      </p>
      <div className="flex flex-col gap-3">
        {languages.map((lang) => (
          <LanguageCard
            key={lang.code}
            {...lang}
            selected={selected === lang.code}
            onSelect={() => setSelected(lang.code)}
          />
        ))}
      </div>
    </IntroStepLayout>
  );
}
