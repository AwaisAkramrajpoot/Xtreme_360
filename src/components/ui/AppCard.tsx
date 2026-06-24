import { AppColors } from "@/constants/colors";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AppCard({ children, className }: AppCardProps) {
  return (
    <div
      className={`mb-4 p-4 bg-white rounded-xl ${className ?? ""}`}
      style={{
        border: `1px solid ${AppColors.lightGrey}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}
