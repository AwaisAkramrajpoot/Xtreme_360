import { AppColors } from "@/constants/colors";

interface AddLabelButtonProps {
  label: string;
  onClick: () => void;
}

export function AddLabelButton({ label, onClick }: AddLabelButtonProps) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 shrink-0">
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
        style={{ backgroundColor: AppColors.primary, boxShadow: `0 4px 8px ${AppColors.primary}4D` }}
      >
        <span className="material-icons text-2xl">add</span>
      </span>
      <span className="text-base font-semibold text-black hidden sm:inline" style={{ fontFamily: "var(--font-poppins)" }}>
        {label}
      </span>
    </button>
  );
}
