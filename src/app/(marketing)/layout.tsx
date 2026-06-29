import {
  SignInButton,
  Show,
  UserButton,
} from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/Button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 sm:px-10">
        <span className="font-semibold text-sm sm:text-base tracking-tight select-none">
          ClarityBoard
        </span>
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
      <footer className="w-full flex flex-row items-start gap-4 px-6 py-8 justify-between sm:flex-col sm:items-center sm:gap-8 sm:px-10 text-sm text-ash">
        <Link href="/" className="flex items-center gap-2 hover:underline hover:underline-offset-4">
          <Image aria-hidden src="/file.svg" alt="ClarityBoard Logo" width={16} height={16} />
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
