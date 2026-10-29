import type { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
