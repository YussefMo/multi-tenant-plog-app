import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@multi-tenant-plog/shared/providers';

const { tenantMock, postsMock } = vi.hoisted(() => ({
  tenantMock: vi.fn(),
  postsMock: vi.fn(),
}));

vi.mock('@/lib/hooks/directory.hook', () => ({
  useTenantDirectory: tenantMock,
  useTenantPosts: postsMock,
}));

import Tenant from '@/components/Tenant';

function renderTenantPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <MemoryRouter initialEntries={['/tenants/1']}>
          <Routes>
            <Route path="/tenants/:tenantId" element={<Tenant />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    </QueryClientProvider>,
  );
}

const tenant = {
  id: 1,
  name: 'Acme',
  category: 'Technology',
  published_posts_count: 5,
};

const posts = {
  data: [
    {
      id: 10,
      tenant_id: 1,
      title: 'Tenant post',
      slug: 'tenant-post',
      body: 'Body text',
      status: 'published',
      published_at: '2026-10-01T10:00:00+00:00',
      author: { id: 1, name: 'Author', role: 'author' },
      tenant: { id: 1, name: 'Acme' },
      created_at: null,
      updated_at: null,
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, to: 1, last_page: 1, total: 1 },
};

describe('Tenant public page', () => {
  beforeEach(() => {
    tenantMock.mockReturnValue({
      data: tenant,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    postsMock.mockReturnValue({
      data: posts,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders the tenant header and published posts', () => {
    renderTenantPage();

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText(/5 published posts/)).toBeInTheDocument();
    expect(screen.getByText('Tenant post')).toBeInTheDocument();
  });

  it('shows an empty state when the tenant has no posts', () => {
    postsMock.mockReturnValue({
      data: {
        data: [],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: null, to: null, last_page: 1, total: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderTenantPage();

    expect(screen.getByText('No published posts')).toBeInTheDocument();
  });
});
