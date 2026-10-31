import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/auth.hook', () => ({
  useViewerMe: () => ({
    data: {
      id: 1,
      role: 'user',
      permissions: ['tenants.view'],
      name: 'Viewer Name',
      email: 'viewer@example.com',
    },
    isLoading: false,
  }),
  useUpdateViewerProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateViewerPassword: () => ({ mutate: vi.fn(), isPending: false }),
  useViewerLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Settings from '@/components/Settings';
import { renderViewer } from './utils';

describe('Viewer settings', () => {
  it('renders profile, password, and app info', () => {
    renderViewer(<Settings />);

    expect(screen.getByLabelText('Name')).toHaveValue('Viewer Name');
    expect(screen.getByLabelText('Email')).toHaveValue('viewer@example.com');
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByText('tenant_session')).toBeInTheDocument();
  });
});
