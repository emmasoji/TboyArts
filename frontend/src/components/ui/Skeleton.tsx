import type { CSSProperties, HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: string;
  delay?: number;
}

export default function Skeleton({
  width,
  height,
  radius = "0.75rem",
  delay = 0,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle: CSSProperties = {
    width,
    height,
    borderRadius: radius,
    animationDelay: `${delay}ms`,
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`tboyarts-skeleton ${className}`}
      style={skeletonStyle}
      {...props}
    />
  );
}
