import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    Show,
    UserButton
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ClarityBoard",
  description: "Full-stack collaborative task planner with AI-powered task generation, real-time multi-user editing, OAuth authentication, and multi-step approval workflows. Demonstrating production-quality architecture, GPT integration, and modern team-oriented SaaS patterns",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex justify-end items-center p-4 gap-4 h-16">
           <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
            </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header> 
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
