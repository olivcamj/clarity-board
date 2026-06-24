import Link from 'next/link';
import type { ReactNode } from 'react';
import { ClarityLogo } from '../../ui/ClarityLogo';

const FOOTER_LINKS = [
  // { href: '/pricing', label: 'Pricing' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

interface AuthLayoutProps {
  /** Left panel */
  eyebrow: string;
  heading: ReactNode;
  description: ReactNode;
  card: ReactNode;
  /** Right panel */
  activeTab: 'sign-in' | 'sign-up';
  formHeading: string;
  formSubtitle: string;
  children: ReactNode;
}

export function AuthLayout({
  eyebrow,
  heading,
  description,
  card,
  activeTab,
  formHeading,
  formSubtitle,
  children,
}: AuthLayoutProps) {
  const isSignIn = activeTab === 'sign-in';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel (decorative, desktop only) ── */}
      <aside
        aria-label="Product information"
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-12 pt-12 pb-8 bg-bone border-r border-biscuit"
      >
        <header>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            <ClarityLogo />
            <span className="font-display italic font-normal">ClarityBoard</span>
          </Link>
        </header>

        <section className="flex flex-col gap-5 max-w-[480px]">
          <p className="text-[11px] tracking-[0.12em] uppercase font-mono text-smoke">
            {eyebrow}
          </p>
          <h2 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.05] text-ink font-normal">
            {heading}
          </h2>
          <p className="text-base leading-relaxed text-ash">
            {description}
          </p>
          {card}
        </section>

        <nav aria-label="Footer" className="flex items-center justify-between text-xs text-smoke">
          <div className="flex items-center gap-5">
            {FOOTER_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-ink transition-colors">
                {label}
              </a>
            ))}
          </div>
          <span>© 2026 ClarityBoard</span>
        </nav>
      </aside>

      {/* ── Right panel (primary content) ── */}
      <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-16 bg-paper overflow-x-clip">
        <div className="w-full max-w-[480px]">
          <nav aria-label="Account navigation" className="flex items-center gap-1 mb-8">
            {isSignIn ? (
              <>
                <span
                  aria-current="page"
                  className="px-4 py-1.5 rounded-md text-sm font-medium border border-biscuit bg-paper text-ink cursor-default"
                >
                  Sign in
                </span>
                <Link
                  href="/sign-up"
                  className="px-4 py-1.5 rounded-md text-sm font-medium text-smoke transition-colors hover:text-ink hover:bg-bone"
                >
                  Create account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-1.5 rounded-md text-sm font-medium text-smoke transition-colors hover:text-ink hover:bg-bone"
                >
                  Sign in
                </Link>
                <span
                  aria-current="page"
                  className="px-4 py-1.5 rounded-md text-sm font-medium border border-biscuit bg-paper text-ink cursor-default"
                >
                  Create account
                </span>
              </>
            )}
          </nav>

          <h1 className="font-display text-[42px] leading-none text-ink font-normal mb-1.5">
            {formHeading}
          </h1>
          <p className="font-display text-base italic text-smoke mb-8">
            {formSubtitle}
          </p>

          {children}
        </div>
      </main>
    </div>
  );
}
