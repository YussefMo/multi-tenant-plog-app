import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({
  useAcceptInvitation: () => ({ mutate, isPending: false, error: null }),
}));

import AcceptInvitationForm from '@/components/auth/AcceptInvitationForm';

describe('AcceptInvitationForm', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('prefills email and token from the query string', () => {
    render(
      <MemoryRouter initialEntries={['/accept-invitation?email=admin%40example.com&token=abc123']}>
        <AcceptInvitationForm />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Email')).toHaveValue('admin@example.com');
    expect(screen.getByLabelText('Invitation token')).toHaveValue('abc123');
  });

  it('requires a valid password and confirmation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/accept-invitation?email=admin%40example.com&token=abc123']}>
        <AcceptInvitationForm />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits the invitation payload', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/accept-invitation?email=admin%40example.com&token=abc123']}>
        <AcceptInvitationForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    expect(mutate).toHaveBeenCalledWith(
      {
        email: 'admin@example.com',
        token: 'abc123',
        password: 'password123',
        password_confirmation: 'password123',
      },
      expect.any(Object),
    );
  });
});
