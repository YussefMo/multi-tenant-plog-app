import type { ReactNode } from 'react';
import { ThemeProvider, type Theme } from '@shared/theme';
import { Toaster } from '@shared/ui/sonner';
import { TooltipProvider } from '@shared/ui/tooltip';

interface AppProvidersProps {
  children: ReactNode;
  themeStorageKey?: string;
  defaultTheme?: Theme;
}

export function AppProviders({
  children,
  themeStorageKey = 'app-theme',
  defaultTheme = 'dark',
}: AppProvidersProps) {
  return (
    <ThemeProvider storageKey={themeStorageKey} defaultTheme={defaultTheme}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
