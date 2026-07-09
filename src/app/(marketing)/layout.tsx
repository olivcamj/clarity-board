import {
  SignInButton,
  Show,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { ClarityLogo } from '../ui/ClarityLogo';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm sm:text-base tracking-tight select-none">
          <ClarityLogo size={20} />
          ClarityBoard
        </Link>
        <div className="flex items-center gap-[8px]">
          <Show when="signed-out">
            <Link href="/demo/dashboard">
              <Button variant="ghost" size="sm">View demo</Button>
            </Link>
            {/* @ts-expect-error asChild works at runtime but not yet typed in this Clerk version */}
            <SignInButton asChild>
              <Button variant="outline" size="sm">Sign in</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>
      {children}
      <footer className="w-full flex flex-col items-center gap-8 px-6 py-8 sm:flex-row sm:items-start sm:gap-4 sm:justify-between sm:px-10 text-sm text-ash">
        <Link href="/" className="flex items-center gap-2 hover:underline hover:underline-offset-4">
          <ClarityLogo size={16} />
          <span>ClarityBoard</span>
        </Link>
        <nav aria-label="Legal">
          <ul className="flex items-center gap-6 justify-around w-[200px]">
            <li><a className="hover:underline hover:underline-offset-4" href="/privacy">Privacy</a></li>
            <li><a className="hover:underline hover:underline-offset-4" href="/terms">Terms</a></li>
            <li><a className="hover:underline hover:underline-offset-4" href="/status" target="_blank" rel="noopener noreferrer">Status</a></li>
          </ul>
        </nav>
      </footer>
    </>
  );
}
