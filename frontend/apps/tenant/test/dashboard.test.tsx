import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/auth.hook', () => ({
  useTenantMe: () => ({
    data: {
      id: 1,
      role: 'admin',
      permissions: ['*'],
      name: 'Admin',
      email: 'admin@example.com',
    },
  }),
}));

vi.mock('@/lib/hooks/tenant.hook', () => ({
  useTenantOverview: () => ({
    data: {
      tenant: {
        id: 1,
        name: 'Acme',
        category: 'Technology',
        allow_support: true,
        is_due: false,
      },
      counts: {
        users: 3,
        profiles: 2,
        posts: { total: 12, draft: 2, published: 9, archived: 1 },
      },
      subscription: {
        id: 1,
        status: 'active',
        plan: { id: 1, name: 'Growth' },
        current_period_end: '2026-11-01T00:00:00+00:00',
        trial_ends_at: null,
        cancel_at_period_end: false,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/post.hook', () => ({
  usePosts: () => ({
    data: {
      data: [
        {
          id: 1,
          tenant_id: 1,
          title: 'Recent post',
          slug: 'recent-post',
          body: '',
          status: 'published',
          published_at: null,
          author: { id: 1, name: 'Admin', role: 'admin' },
          created_at: null,
          updated_at: null,
        },
      ],
      meta: { total: 1, current_page: 1, last_page: 1, from: 1, to: 1 },
    },
    isLoading: false,
  }),
}));

vi.mock('@/lib/hooks/billing.hook', () => ({
  useInvoices: () => ({
    data: { data: [], meta: { total: 0, current_page: 1, last_page: 1, from: null, to: null } },
    isLoading: false,
  }),
  usePayments: () => ({
    data: { data: [], meta: { total: 0, current_page: 1, last_page: 1, from: null, to: null } },
    isLoading: false,
  }),
}));

import Dashboard from '@/components/Dashboard';
import { renderTenant } from './utils';

describe('Dashboard', () => {
  it('renders counts, recent posts, and subscription', () => {
    renderTenant(<Dashboard />);

    expect(screen.getByText('Acme · Technology')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Recent post')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });
});
