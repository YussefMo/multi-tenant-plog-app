import type { ReactNode } from 'react';
import { AppProviders, QueryProvider } from '@multi-tenant-plog/shared/providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppProviders>{children}</AppProviders>
    </QueryProvider>
  );
}
