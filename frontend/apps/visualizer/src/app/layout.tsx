import type { ReactNode } from 'react';
import { AppProviders } from '@multi-tenant-plog/shared/providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <AppProviders themeStorageKey="atlas-theme">{children}</AppProviders>;
}
