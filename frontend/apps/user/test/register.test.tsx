import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({
  useViewerRegister: () => ({ mutate, isPending: false }),
}));

import RegisterForm from '@/components/auth/RegisterForm';

describe('viewer RegisterForm', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('validates required fields and password confirmation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits a valid registration', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Name'), 'Viewer One');
    await user.type(screen.getByLabelText('Email'), 'viewer@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(mutate).toHaveBeenCalledWith(
      {
        name: 'Viewer One',
        email: 'viewer@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      },
      expect.any(Object),
    );
  });
});
