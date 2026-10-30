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
    },
  }),
}));

vi.mock('@/lib/hooks/profile.hook', () => ({
  usePermissionCatalog: () => ({
    data: {
      catalog: ['posts.view.any', 'posts.publish'],
      presets: { admin: ['*'] },
    },
    isLoading: false,
  }),
}));

import ProfileForm from '@/components/permission-profile/ProfileForm';

describe('ProfileForm', () => {
  it('requires a name and at least one permission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProfileForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /create profile/i }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Select at least one permission.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits selected permissions', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ProfileForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Editors');
    await user.click(screen.getByRole('checkbox', { name: /posts.view.any/i }));
    await user.click(screen.getByRole('checkbox', { name: /posts.publish/i }));
    await user.click(screen.getByRole('button', { name: /create profile/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Editors',
      description: null,
      permissions: ['posts.view.any', 'posts.publish'],
    });
  });
});
