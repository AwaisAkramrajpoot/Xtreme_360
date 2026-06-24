import { AppColors } from "@/constants/colors";

interface PoweredByProps {
  showNumber?: boolean;
}

export function PoweredBy({ showNumber = false }: PoweredByProps) {
  return (
    <p className="text-xs text-center" style={{ color: AppColors.grey, fontFamily: "var(--font-poppins)" }}>
      Powered by Xtreme Computer{" "}
      {showNumber && (
        <a href="tel:+923453648374" className="text-blue-600 underline font-normal">
          +92 345 3648374
        </a>
      )}
    </p>
  );
}
