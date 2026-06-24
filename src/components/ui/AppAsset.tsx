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
}

export function AppAsset({
  src,
  alt = "",
  width,
  height,
  className,
  fill,
  style,
}: AppAssetProps) {
  if (src.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
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
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 24}
      height={height ?? 24}
      className={className}
      style={style}
    />
  );
}
