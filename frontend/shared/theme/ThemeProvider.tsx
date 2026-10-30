import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
  storageKey?: string;
  defaultTheme?: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function storedTheme(storageKey: string, fallback: Theme): Theme {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(storageKey);

  return stored === 'light' || stored === 'dark' ? stored : fallback;
}

export function ThemeProvider({
  children,
  storageKey = 'app-theme',
  defaultTheme = 'dark',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => storedTheme(storageKey, defaultTheme));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(storageKey, theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#050b12' : '#f4f7fa');
  }, [storageKey, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
