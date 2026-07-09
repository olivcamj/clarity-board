import type { CSSProperties } from "react";

export interface SparkProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

// 4-point sparkle 'star' used to mark AI suggestions.
export function Spark({
  size = 16,
  color = "var(--ember)",
  style,
}: SparkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0, ...style }}
      aria-hidden
    >
      <path
        d="M16 4 L18.5 13.5 L28 16 L18.5 18.5 L16 28 L13.5 18.5 L4 16 L13.5 13.5 Z"
        fill={color}
      />
    </svg>
  );
}
