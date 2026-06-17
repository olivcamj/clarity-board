import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "check"
  | "flag"
  | "comment"
  | "attach"
  | "link"
  | "plus"
  | "clock"
  | "layers";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  style?: CSSProperties;
  /** Provide a label only for standalone icons with no accompanying text. Omit for decorative icons. */
  label?: string;
}

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  stroke = 1.8,
  style,
  label,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { flexShrink: 0, ...style },
    ...(label
      ? { role: "img" as const, "aria-label": label }
      : { "aria-hidden": true as const }),
  };

  const paths: Record<IconName, ReactNode> = {
    check: <polyline points="5 12 10 17 19 7" />,
    flag: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h12l-3 4 3 4H6" />
        <path d="M4 21h4" />
      </>
    ),
    comment: <path d="M21 12a8 8 0 0 1-11.8 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12Z" />,
    attach: <path d="m21 11-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />,
    link: (
      <>
        <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
        <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 8 12 14 22 8 12 2" />
        <path d="M2 13l10 6 10-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}
