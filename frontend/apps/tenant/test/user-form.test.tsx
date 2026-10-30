import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/auth.hook', () => ({
  useTenantMe: () => ({
    data: {
      id: 1,
      role: 'admin',
      permissions: ['*'],
      name: 'Admin',
      email: 'admin@example.com',
      tenant: { id: 1, name: 'Acme' },
    },
  }),
}));

vi.mock('@/lib/hooks/profile.hook', () => ({
  usePermissionCatalog: () => ({
    data: {
      catalog: ['posts.view.any', 'posts.create'],
      presets: { admin: ['*'] },
    },
    isLoading: false,
  }),
  useProfiles: () => ({
    data: {
      data: [
        {
          id: 1,
          name: 'Editors',
          description: null,
          permissions: [],
          users_count: 0,
          created_at: null,
        },
      ],
      meta: { total: 1, current_page: 1, last_page: 1, from: 1, to: 1 },
    },
    isLoading: false,
  }),
}));

import UserForm from '@/components/user/UserForm';

describe('UserForm', () => {
  it('disables password fields when invite is checked', async () => {
    const user = userEvent.setup();

    render(<UserForm mode="create" onSubmit={vi.fn()} />);

    const invite = screen.getByLabelText('Invite user');
    expect(invite).toBeChecked();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm password')).toBeDisabled();

    await user.click(invite);

    expect(screen.getByLabelText('Password')).toBeEnabled();
    expect(screen.getByLabelText('Confirm password')).toBeEnabled();
  });

  it('submits an invite without a password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Author');
    await user.type(screen.getByLabelText('Email'), 'author@example.com');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Author',
        email: 'author@example.com',
        invite: true,
        role: 'author',
      }),
    );
  });

  it('requires a password when invite is unchecked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Author');
    await user.type(screen.getByLabelText('Email'), 'author@example.com');
    await user.click(screen.getByLabelText('Invite user'));
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a password when invite is unchecked and valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UserForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Author');
    await user.type(screen.getByLabelText('Email'), 'author@example.com');
    await user.click(screen.getByLabelText('Invite user'));
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        invite: false,
        password: 'password123',
        password_confirmation: 'password123',
      }),
    );
  });
});
