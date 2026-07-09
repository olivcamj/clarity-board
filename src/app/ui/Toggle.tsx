'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        width: 44,
        height: 24,
        background: checked ? 'var(--slate)' : 'var(--chalk)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          width: 20,
          height: 20,
          margin: 2,
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
