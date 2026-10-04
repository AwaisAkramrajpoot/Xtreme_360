"use client";

interface AppSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
}

export function AppSwitch({ value, onChange, disabled, ariaLabel, id }: AppSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className="relative w-12 h-7 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: value ? "#588157" : "#E7E8E7" }}
    >
      <span
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-[left]"
        style={{ left: value ? "22px" : "2px" }}
      />
    </button>
  );
}
