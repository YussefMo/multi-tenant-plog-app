import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@multi-tenant-plog/shared/providers';

export function renderOwner(ui: ReactElement, route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AppProviders>
    </QueryClientProvider>,
  );
}

export function OwnerProviders({ children, route = '/' }: { children: ReactNode; route?: string }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AppProviders>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AppProviders>
    </QueryClientProvider>
  );
}
