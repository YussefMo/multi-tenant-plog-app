import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { useBillingMetrics } = vi.hoisted(() => ({ useBillingMetrics: vi.fn() }));

vi.mock('@/lib/hooks/billing.hook', () => ({ useBillingMetrics }));

import Billing from '@/components/Billing';

describe('Billing', () => {
  it('renders billing metrics, charts, and payment statuses', () => {
    useBillingMetrics.mockReturnValue({
      data: {
        period: { from: null, to: null },
        mrr: 25000,
        arr: 300000,
        currency: 'usd',
        subscriptions: { active: 1, trialing: 1, past_due: 0, canceled: 0, total: 2 },
        revenue: { gross: 250000, refunds: 30000, net: 220000 },
        failed_payments: 2,
        disputes: 2,
        payment_status_counts: { succeeded: 16, refunded: 2, failed: 2, disputed: 2 },
        churn_rate: 0,
        plan_distribution: [{ plan_id: 1, plan: 'Plan 1', count: 1, mrr: 5000 }],
        revenue_by_tenant: [
          {
            tenant_id: 1,
            tenant: 'Demo Tenant',
            gross_revenue: 50000,
            refunds: 6000,
            net_revenue: 44000,
          },
        ],
        timeline: [
          {
            period: '2026-10',
            label: 'Oct 2026',
            timestamp: '2026-10-01T00:00:00+00:00',
            gross: 250000,
            refunds: 30000,
            net: 220000,
            payments: 20,
            failed_payments: 2,
            disputes: 2,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>,
    );

    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getAllByText('$250.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Revenue timeline')).toBeInTheDocument();
    expect(screen.getByText('Plan distribution')).toBeInTheDocument();
    expect(screen.getByText('Revenue by tenant')).toBeInTheDocument();
    expect(screen.getByText('Payment statuses')).toBeInTheDocument();
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
  });

  it('shows an error panel when metrics fail', () => {
    useBillingMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Metrics unavailable'),
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Billing />
      </MemoryRouter>,
    );

    expect(screen.getByText('Unable to load this data')).toBeInTheDocument();
    expect(screen.getByText('Metrics unavailable')).toBeInTheDocument();
  });
});
