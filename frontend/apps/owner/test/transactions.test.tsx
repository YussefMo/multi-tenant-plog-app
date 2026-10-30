import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { useTransactions } = vi.hoisted(() => ({ useTransactions: vi.fn() }));

vi.mock('@/lib/hooks/billing.hook', () => ({ useTransactions }));
vi.mock('@/lib/hooks/tenant.hook', () => ({
  useTenants: () => ({
    data: {
      data: [{ id: 1, name: 'Acme Inc' }],
      meta: { total: 1, current_page: 1, last_page: 1, from: 1, to: 1 },
    },
    isLoading: false,
  }),
}));

import Transactions from '@/components/Transactions';

describe('Transactions', () => {
  it('renders transactions and filter controls', () => {
    useTransactions.mockReturnValue({
      data: {
        data: [
          {
            id: 10,
            type: 'payment',
            tenant_id: 1,
            stripe_charge_id: 'ch_123',
            stripe_payment_intent_id: null,
            stripe_invoice_id: null,
            amount: 1999,
            amount_refunded: 0,
            currency: 'usd',
            status: 'succeeded',
            paid_at: '2026-10-01T00:00:00+00:00',
            tenant: { id: 1, name: 'Acme Inc' },
            created_at: '2026-10-01T00:00:00+00:00',
          },
        ],
        meta: { total: 1, current_page: 1, last_page: 1, from: 1, to: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>,
    );

    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(screen.getByText('All tenants')).toBeInTheDocument();
    expect(screen.getByText('All statuses')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('renders an empty state when there are no transactions', () => {
    useTransactions.mockReturnValue({
      data: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1, from: null, to: null },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>,
    );

    expect(screen.getByText('No transactions')).toBeInTheDocument();
  });
});
