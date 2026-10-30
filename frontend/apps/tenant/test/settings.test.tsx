import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/auth.hook', () => ({
  useTenantMe: () => ({
    data: {
      id: 1,
      role: 'admin',
      permissions: ['*'],
      name: 'Admin Name',
      email: 'admin@example.com',
    },
    isLoading: false,
  }),
  useUpdateTenantProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTenantPassword: () => ({ mutate: vi.fn(), isPending: false }),
  useTenantLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/hooks/tenant.hook', () => ({
  useTenant: () => ({
    data: {
      id: 1,
      name: 'Acme',
      category: 'Technology',
      allow_support: true,
      is_due: false,
      deleted_at: null,
      created_at: null,
    },
    isLoading: false,
  }),
  useUpdateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Settings from '@/components/Settings';
import { renderTenant } from './utils';

describe('Settings', () => {
  it('renders tenant settings and account forms', () => {
    renderTenant(<Settings />);

    expect(screen.getByLabelText('Tenant name')).toHaveValue('Acme');
    expect(screen.getByLabelText('Name')).toHaveValue('Admin Name');
    expect(screen.getByLabelText('Email')).toHaveValue('admin@example.com');
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByText('tenant_session')).toBeInTheDocument();
  });
});
