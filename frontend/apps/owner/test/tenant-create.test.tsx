import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/lib/hooks/tenant.hook', () => ({
  useCreateTenant: () => ({ mutate, isPending: false, error: null }),
}));

import TenantCreate from '@/components/TenantCreate';

describe('TenantCreate', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('validates required tenant and admin fields', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TenantCreate />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /create tenant/i }));

    expect(screen.getByText('Tenant name is required.')).toBeInTheDocument();
    expect(screen.getByText('Admin name is required.')).toBeInTheDocument();
    expect(screen.getByText('Admin email is required.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits a valid create payload', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TenantCreate />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Tenant name'), 'Acme Inc');
    await user.type(screen.getByLabelText('Category'), 'Technology');
    await user.type(screen.getByLabelText('Admin name'), 'Acme Admin');
    await user.type(screen.getByLabelText('Admin email'), 'admin@acme.test');
    await user.click(screen.getByRole('button', { name: /create tenant/i }));

    expect(mutate).toHaveBeenCalledWith(
      {
        name: 'Acme Inc',
        category: 'Technology',
        admin_name: 'Acme Admin',
        admin_email: 'admin@acme.test',
      },
      expect.any(Object),
    );
  });
});
