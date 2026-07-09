import type { ReactNode } from "react";
import type { BadgeTone } from "@/types/task";

export interface BadgeProps {
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

interface ToneClasses {
  bg: string;
  text: string;
  dot: string;
}

const TONES: Record<BadgeTone, ToneClasses> = {
  ok:    { bg: "bg-sage-soft",  text: "text-[#4A5941]", dot: "bg-sage"  },
  warn:  { bg: "bg-ochre-soft", text: "text-[#8A6F22]", dot: "bg-ochre" },
  bad:   { bg: "bg-rose-soft",  text: "text-[#8E4A42]", dot: "bg-rose"  },
  info:  { bg: "bg-sky-soft",   text: "text-[#3F5770]", dot: "bg-sky"   },
  ai:    { bg: "bg-ember-soft", text: "text-ember-hot", dot: "bg-ember" },
  slate: { bg: "bg-slate-soft", text: "text-slate-ink", dot: "bg-slate" },
  plum:  { bg: "bg-plum-soft",  text: "text-[#5E4B6B]", dot: "bg-plum"  },
  ghost: { bg: "bg-bone",       text: "text-ash",        dot: "bg-smoke" },
};

export function Badge({
  tone = "ghost",
  size = "md",
  dot = false,
  children,
  className,
}: BadgeProps) {
  const t = TONES[tone];
  const sizeClasses = size === "sm"
    ? "text-[11px] py-[1px] px-[7px]"
    : "text-xs py-[2px] px-[9px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-ui font-medium rounded-full leading-[1.5] ${t.bg} ${t.text} ${sizeClasses}${className ? ` ${className}` : ""}`}
    >
      {dot && <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}
