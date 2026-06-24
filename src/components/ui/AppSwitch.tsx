"use client";

interface AppSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function AppSwitch({ value, onChange }: AppSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-12 h-7 rounded-full transition-colors"
      style={{ backgroundColor: value ? "#588157" : "#E7E8E7" }}
    >
      <span
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
        style={{ left: value ? "22px" : "2px" }}
      />
    </button>
  );
}
