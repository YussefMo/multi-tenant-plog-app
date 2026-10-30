import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlanForm from '@/components/plan/PlanForm';

describe('PlanForm', () => {
  it('converts major units to minor units on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PlanForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Starter');
    await user.type(screen.getByLabelText('Amount'), '19.99');
    await user.click(screen.getByRole('button', { name: /create plan/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Starter',
        amount: 1999,
        currency: 'usd',
        interval: 'month',
        is_active: true,
      }),
    );
  });

  it('requires a name and a valid amount', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PlanForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /create plan/i }));

    expect(screen.getByText('Plan name is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid non-negative amount.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills an existing plan in major units', () => {
    render(
      <PlanForm
        initialPlan={{
          id: 1,
          name: 'Growth',
          slug: 'growth',
          stripe_product_id: null,
          stripe_price_id: null,
          amount: 4900,
          currency: 'usd',
          interval: 'month',
          features: ['analytics'],
          limits: { max_users: 10 },
          is_active: true,
          subscriptions_count: 3,
          active_subscriptions_count: 2,
          created_at: null,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Growth');
    expect(screen.getByLabelText('Amount')).toHaveValue(49);
    expect(screen.getByLabelText('Max users')).toHaveValue(10);
  });
});
