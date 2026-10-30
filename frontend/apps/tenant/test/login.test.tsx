import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({
  useTenantLogin: () => ({ mutate, isPending: false }),
}));

import LoginForm from '@/components/auth/LoginForm';

describe('tenant LoginForm', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits valid credentials', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        password: 'password123',
      }),
      expect.any(Object),
    );
  });
});
