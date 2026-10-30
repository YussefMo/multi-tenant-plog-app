import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@multi-tenant-plog/shared/providers';

const { useTenant, supportMutate, deleteMutate, restoreMutate, purgeMutate } = vi.hoisted(() => ({
  useTenant: vi.fn(),
  supportMutate: vi.fn(),
  deleteMutate: vi.fn(),
  restoreMutate: vi.fn(),
  purgeMutate: vi.fn(),
}));

vi.mock('@/lib/hooks/tenant.hook', () => ({
  useTenant,
  useSupportAccess: () => ({ mutate: supportMutate, isPending: false }),
  useDeleteTenant: () => ({ mutate: deleteMutate, isPending: false }),
  useRestoreTenant: () => ({ mutate: restoreMutate, isPending: false }),
  useForceDeleteTenant: () => ({ mutate: purgeMutate, isPending: false }),
}));

import Tenant from '@/components/Tenant';

function renderTenant() {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/tenants/1']}>
        <Routes>
          <Route path="/tenants/:tenantId" element={<Tenant />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('Tenant detail', () => {
  it('renders tenant, admin, subscription, and counts', () => {
    useTenant.mockReturnValue({
      data: {
        id: 1,
        name: 'Acme Inc',
        category: 'Technology',
        allow_support: true,
        is_due: false,
        deleted_at: null,
        created_at: '2026-10-01T00:00:00+00:00',
        admin: {
          id: 2,
          name: 'Acme Admin',
          email: 'admin@acme.test',
          role: 'admin',
          created_at: '2026-10-01T00:00:00+00:00',
        },
        invitation: {
          email: 'admin@acme.test',
          expires_at: '2026-10-08T00:00:00+00:00',
          accepted_at: null,
        },
        subscription: {
          id: 5,
          status: 'active',
          plan: { id: 1, name: 'Growth' },
          current_period_end: '2026-11-01T00:00:00+00:00',
          cancel_at_period_end: false,
        },
        counts: { users: 3, posts: 50 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderTenant();

    expect(screen.getByRole('heading', { name: 'Acme Inc' })).toBeInTheDocument();
    expect(screen.getAllByText('admin@acme.test').length).toBeGreaterThan(0);
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open support session' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete tenant' })).toBeInTheDocument();
  });

  it('explains when support access is disabled', () => {
    useTenant.mockReturnValue({
      data: {
        id: 1,
        name: 'Acme Inc',
        category: 'Technology',
        allow_support: false,
        is_due: false,
        deleted_at: null,
        created_at: null,
        admin: null,
        invitation: null,
        subscription: null,
        counts: { users: 0, posts: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderTenant();

    expect(screen.getByText(/Support access is disabled for this tenant/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open support session' })).toBeDisabled();
  });

  it('shows restore and purge actions for deleted tenants', () => {
    useTenant.mockReturnValue({
      data: {
        id: 1,
        name: 'Acme Inc',
        category: 'Technology',
        allow_support: true,
        is_due: false,
        deleted_at: '2026-10-05T00:00:00+00:00',
        created_at: null,
        admin: null,
        invitation: null,
        subscription: null,
        counts: { users: 0, posts: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderTenant();

    expect(screen.getByRole('button', { name: 'Restore tenant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete forever' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Support' })).toBeDisabled();
  });
});
