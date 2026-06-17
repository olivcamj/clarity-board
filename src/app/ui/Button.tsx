import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  tone?: 'primary' | 'ember' | 'rose';
  size?: 'sm' | 'md' | 'icon-sm' | 'icon-md';
}

const BASE =
  'inline-flex items-center justify-center gap-[5px] font-ui font-medium cursor-pointer select-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate';

const VARIANT_TONE: Record<string, Record<string, string>> = {
  solid: {
    primary: 'bg-slate text-white hover:bg-slate-hot disabled:bg-chalk disabled:text-smoke',
    ember:   'bg-ember text-white hover:bg-ember-hot disabled:bg-chalk disabled:text-smoke',
    rose:    'bg-rose text-white hover:bg-rose-hot disabled:bg-chalk disabled:text-smoke',
  },
  outline: {
    primary: 'border border-slate text-slate bg-transparent hover:bg-slate-soft',
    ember:   'border border-ember text-ember bg-transparent hover:bg-ember-soft',
    rose:    'border border-rose text-rose bg-transparent hover:bg-rose-soft',
  },
  ghost: {
    primary: 'text-ash bg-transparent hover:bg-sand',
    ember:   'text-ember bg-transparent hover:bg-ember-soft',
    rose:    'text-rose bg-transparent hover:bg-rose-soft',
  },
};

// Sizes: sm = pill (for inline/AI actions), md = rounded rect (for form actions),
// icon-sm/icon-md = square icon-only buttons.
const SIZE: Record<string, string> = {
  sm:        'text-[12px] py-[4px] px-[12px] rounded-full',
  md:        'text-[12px] py-[6px] px-[14px] rounded-[8px]',
  'icon-sm': 'w-[28px] h-[28px] rounded-[6px]',
  'icon-md': 'w-[32px] h-[32px] rounded-[6px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'ghost', tone = 'primary', size = 'md', className, children, ...props }, ref) {
    const cls = [BASE, VARIANT_TONE[variant][tone], SIZE[size], className]
      .filter(Boolean)
      .join(' ');
    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  }
);
