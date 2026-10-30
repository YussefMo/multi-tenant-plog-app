import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ pending: false, variables: 7 as number | undefined }));

vi.mock('@/lib/hooks/tenant.hook', () => ({
  useTenants: () => ({
    data: {
      data: [
        {
          id: 7,
          name: 'Acme',
          category: 'Technology',
          allow_support: false,
          is_due: false,
          deleted_at: '2026-10-01T00:00:00+00:00',
          created_at: '2026-09-01T00:00:00+00:00',
        },
      ],
      meta: { total: 1, current_page: 1, last_page: 1, from: 1, to: 1 },
      links: { first: null, last: null, prev: null, next: null },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePurgedTenants: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useDeleteTenant: () => ({
    mutate: vi.fn(),
    isPending: state.pending,
    variables: state.variables,
  }),
  useRestoreTenant: () => ({
    mutate: vi.fn(),
    isPending: state.pending,
    variables: state.variables,
  }),
  useForceDeleteTenant: () => ({
    mutate: vi.fn(),
    isPending: state.pending,
    variables: state.variables,
  }),
  useSupportAccess: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Tenants from '@/components/Tenants';
import { renderOwner } from './utils';

describe('Tenants recovery actions', () => {
  beforeEach(() => {
    state.pending = false;
    state.variables = 7;
  });

  it('keeps restore and purge enabled after a finished mutation', () => {
    renderOwner(<Tenants />, '/tenants?state=trashed');

    expect(screen.getByLabelText('Restore')).not.toBeDisabled();
    expect(screen.getByLabelText('Delete forever')).not.toBeDisabled();
  });

  it('disables recovery actions while a mutation is pending', () => {
    state.pending = true;

    renderOwner(<Tenants />, '/tenants?state=trashed');

    expect(screen.getByLabelText('Restore')).toBeDisabled();
    expect(screen.getByLabelText('Delete forever')).toBeInTheDocument();
  });
});
