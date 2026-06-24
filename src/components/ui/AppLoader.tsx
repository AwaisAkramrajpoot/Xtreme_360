import { AppColors } from "@/constants/colors";

export function AppLoader({ color = AppColors.primary }: { color?: string }) {
  return (
    <div className="flex justify-center items-center p-8">
      <span
        className="inline-block w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: color, borderTopColor: "transparent" }}
      />
    </div>
  );
}

export function AppLoaderTwo({ color = AppColors.primary }: { color?: string }) {
  return (
    <div className="flex justify-center items-center gap-1 p-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full animate-bounce"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
