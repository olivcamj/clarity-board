import type { KeyboardEvent } from "react";

export interface CheckboxProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  size?: number;
  ai?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  size = 16,
  ai = false,
}: CheckboxProps) {
  const accent = ai ? "var(--ember)" : "var(--slate)";

  const toggle = () => onChange?.(!checked);

  const handleKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <span className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
        onKeyDown={handleKey}
        className="inline-flex items-center justify-center transition-all duration-[180ms] ease-[cubic-bezier(0.2,0.7,0.1,1)] shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          border: `1.5px solid ${checked ? accent : "var(--chalk)"}`,
          background: checked ? accent : "var(--paper)",
        }}
      >
        {checked && (
          <svg
            aria-hidden="true"
            width={size * 0.72}
            height={size * 0.72}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="5 12 10 17 19 7" />
          </svg>
        )}
      </span>
      {label && <span className="text-[13px]">{label}</span>}
    </span>
  );
}
