import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useOwnerMe, profileMutate, passwordMutate, logoutMutate } = vi.hoisted(() => ({
  useOwnerMe: vi.fn(),
  profileMutate: vi.fn(),
  passwordMutate: vi.fn(),
  logoutMutate: vi.fn(),
}));

vi.mock('@/lib/hooks/auth.hook', () => ({
  useOwnerMe,
  useUpdateOwnerProfile: () => ({ mutate: profileMutate, isPending: false }),
  useUpdateOwnerPassword: () => ({ mutate: passwordMutate, isPending: false }),
  useOwnerLogout: () => ({ mutate: logoutMutate, isPending: false }),
}));

import Settings from '@/components/Settings';
import { renderOwner } from './utils';

describe('Settings', () => {
  it('shows the owner profile and password forms', () => {
    useOwnerMe.mockReturnValue({
      data: {
        id: 1,
        name: 'Owner Name',
        email: 'owner@example.com',
        is_active: true,
        created_at: '2026-01-01T00:00:00+00:00',
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderOwner(<Settings />);

    expect(screen.getByLabelText('Name')).toHaveValue('Owner Name');
    expect(screen.getByLabelText('Email')).toHaveValue('owner@example.com');
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
    expect(screen.getByText('owner_session')).toBeInTheDocument();
  });
});
