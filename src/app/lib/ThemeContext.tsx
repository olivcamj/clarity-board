'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type ColorTheme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

const THEME_COOKIE_NAME = 'color-theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  theme: ColorTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function resolveTheme(theme: ColorTheme): ResolvedTheme {
  return theme === 'auto' ? getSystemTheme() : theme;
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: ColorTheme;
}) {
  const [theme, setThemeState] = useState<ColorTheme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(initialTheme));

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.dataset.theme = resolved;
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const mql = window.matchMedia(DARK_MEDIA_QUERY);
    const handleChange = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      document.documentElement.dataset.theme = resolved;
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((next: ColorTheme) => {
    setThemeState(next);
    document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
