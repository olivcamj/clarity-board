import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible group label — not visually rendered */
  groupLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  groupLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="inline-flex border border-chalk rounded-[8px] overflow-hidden"
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={[
              'inline-flex items-center gap-[6px] px-[14px] py-[7px] text-[13px] font-ui cursor-pointer',
              'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate',
              index > 0 ? 'border-l border-chalk' : '',
              isSelected
                ? 'bg-paper text-ink font-medium shadow-[var(--shadow-1)] active:opacity-90'
                : 'bg-transparent text-ash hover:text-ink hover:bg-bone active:bg-sand',
            ].filter(Boolean).join(' ')}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
