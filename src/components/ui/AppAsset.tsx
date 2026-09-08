import Image from "next/image";
import clsx from "clsx";

interface AppAssetProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

function resolveImageStyle(
  className: string | undefined,
  style: React.CSSProperties | undefined,
  fill: boolean | undefined,
  width: number,
  height: number
): React.CSSProperties {
  if (fill) return { ...style };

  const cn = className ?? "";
  const hasWidthClass = /\b(w-|max-w-|min-w-|size-|!w-)/.test(cn);
  const hasHeightClass = /\b(h-|max-h-|min-h-|size-|!h-)/.test(cn);

  // Prefer explicit pixel size from props so avatars/icons stay constrained.
  // Only defer to CSS when the caller passes size utilities (w-*, h-*, etc.).
  if (!hasWidthClass && !hasHeightClass) {
    return { width, height, maxWidth: "none", ...style };
  }

  const next: React.CSSProperties = { ...style };
  if (hasWidthClass && !hasHeightClass && next.height === undefined) {
    next.height = "auto";
  }
  if (hasHeightClass && !hasWidthClass && next.width === undefined) {
    next.width = "auto";
  }
  return next;
}

export function AppAsset({
  src,
  alt = "",
  width,
  height,
  className,
  fill,
  style,
  priority,
  loading,
}: AppAssetProps) {
  const resolvedWidth = width ?? 24;
  const resolvedHeight = height ?? 24;
  const imageStyle = resolveImageStyle(className, style, fill, resolvedWidth, resolvedHeight);

  if (src.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        className={className}
        style={imageStyle}
        loading={loading ?? (priority ? "eager" : undefined)}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={clsx("object-contain", className)}
        style={style}
        priority={priority}
        loading={loading}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={resolvedWidth}
      height={resolvedHeight}
      className={className}
      style={imageStyle}
      priority={priority}
      loading={loading ?? (priority ? "eager" : undefined)}
    />
  );
}
