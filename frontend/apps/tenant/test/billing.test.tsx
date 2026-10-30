import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/billing.hook', () => ({
  useSubscription: () => ({
    data: {
      id: 1,
      tenant_id: 1,
      plan_id: 1,
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: '2026-11-01T00:00:00+00:00',
      trial_ends_at: null,
      cancel_at_period_end: false,
      plan: {
        id: 1,
        name: 'Growth',
        slug: 'growth',
        stripe_product_id: null,
        stripe_price_id: null,
        amount: 4900,
        currency: 'usd',
        interval: 'month',
        features: [],
        limits: {},
        is_active: true,
        subscriptions_count: 1,
        active_subscriptions_count: 1,
        created_at: null,
      },
      features: [],
      limits: {},
      created_at: null,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useInvoices: () => ({
    data: { data: [], meta: { total: 0, current_page: 1, last_page: 1, from: null, to: null } },
    isLoading: false,
  }),
  usePayments: () => ({
    data: { data: [], meta: { total: 0, current_page: 1, last_page: 1, from: null, to: null } },
    isLoading: false,
  }),
  usePortal: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelSubscription: () => ({ mutate: vi.fn(), isPending: false }),
}));

import Billing from '@/components/Billing';

describe('Billing', () => {
  it('renders the subscription and billing sections', () => {
    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>,
    );

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('Recent invoices')).toBeInTheDocument();
    expect(screen.getByText('Recent payments')).toBeInTheDocument();
  });
});
