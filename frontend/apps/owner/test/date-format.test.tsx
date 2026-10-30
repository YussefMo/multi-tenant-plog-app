import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DateTextInput from '@/components/billing/DateTextInput';
import { formatDate } from '@/lib/format';

describe('date formatting', () => {
  it('formats dates in US month-first style', () => {
    expect(formatDate('2026-10-29T12:00:00+00:00')).toMatch(/^Oct \d{1,2}, 2026$/);
  });
});

describe('DateTextInput', () => {
  it('shows the dd mm yyyy placeholder', () => {
    render(<DateTextInput value="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('dd mm yyyy')).toBeInTheDocument();
  });

  it('converts dd mm yyyy input to an ISO date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DateTextInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd mm yyyy');
    await user.type(input, '29 10 2026');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith('2026-10-29');
  });

  it('renders an ISO value as dd mm yyyy', () => {
    render(<DateTextInput value="2026-10-29" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('dd mm yyyy')).toHaveValue('29 10 2026');
  });
});
