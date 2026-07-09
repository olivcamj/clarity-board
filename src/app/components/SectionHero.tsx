import type { ReactNode } from 'react';

interface SectionHeroProps {
  eyebrow?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionHero({ eyebrow, subtitle, children, className = '' }: SectionHeroProps) {
  return (
    <div className={`flex flex-col items-center text-center py-16 px-8 sm:px-20 ${className}`}>
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-ash mb-5">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-[48px] sm:text-[56px] lg:text-[72px] leading-[1.05] tracking-[-0.01em] text-ink max-w-4xl">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-6 text-base text-ash max-w-md leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
