import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 sm:px-10">
        <span className="font-semibold text-sm sm:text-base tracking-tight select-none">
          ClarityBoard
        </span>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton asChild>
              <button className="bg-[#3b6fb5] text-white rounded-full font-medium text-sm sm:text-base h-9 sm:h-10 px-4 sm:px-5 cursor-pointer">
                Sign Up
              </button>
            </SignUpButton>
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
