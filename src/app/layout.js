import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import Script from 'next/script';
import { ThemeProvider } from './lib/ThemeContext';
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

const VALID_THEMES = ['light', 'dark', 'auto'];

// Resolves 'auto' via prefers-color-scheme and sets data-theme on <html>
// before hydration, so a system-preference theme never flashes the wrong color.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var cookieMatch = document.cookie.match(/(?:^|; )color-theme=([^;]*)/);
    var preference = cookieMatch ? decodeURIComponent(cookieMatch[1]) : 'light';
    var resolvedTheme = preference === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = resolvedTheme;
  } catch (error) {}
})();
`;

export default async function RootLayout({ children }) {
  const themeCookie = (await cookies()).get('color-theme')?.value;
  const initialTheme = VALID_THEMES.includes(themeCookie) ? themeCookie : 'light';

  return (
    <html lang="en" suppressHydrationWarning data-theme={initialTheme === 'auto' ? undefined : initialTheme}>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider initialTheme={initialTheme}>
          <ClerkProvider afterSignOutUrl="/sign-in">
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
