import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "check"
  | "flag"
  | "comment"
  | "attach"
  | "link"
  | "plus"
  | "clock"
  | "layers"
  | "board"
  | "table"
  | "list"
  | "timeline"
  | "inbox"
  | "activity"
  | "people"
  | "teams"
  | "home"
  | "shield"
  | "settings"
  | "logout"
  | "panel-left"
  | "sun"
  | "moon"
  | "menu"
  | "search"
  | "chevron-left"
  | "chevron-down"
  | "bell"
  | "filter";

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
    board: (
      <>
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="12" rx="1" />
        <rect x="17" y="3" width="5" height="16" rx="1" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </>
    ),
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    timeline: <path d="M3 6h11M8 12h9M3 18h7" strokeWidth="2.5" />,
    inbox: (
      <>
        <path d="M22 12h-6l-2 3H10l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </>
    ),
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    people: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    teams: (
      <>
        <rect x="2" y="7" width="8" height="8" rx="1.5" />
        <rect x="14" y="7" width="8" height="8" rx="1.5" />
        <path d="M10 11h4" />
      </>
    ),
    home: (
      <>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    shield: <path d="M12 2L15 8h6l-4.8 3.5 1.8 6L12 14 6 17.5l1.8-6L3 8h6L12 2z" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    "panel-left": (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
