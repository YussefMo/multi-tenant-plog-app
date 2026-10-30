import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { AppProviders } from '@shared/providers';

export function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders>{ui}</AppProviders>);
}

export function Providers({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
