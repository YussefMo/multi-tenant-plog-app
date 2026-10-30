import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({
  useSupportLogin: () => ({
    mutate,
    isPending: true,
    isError: false,
    error: null,
  }),
}));

import SupportAccept from '@/components/auth/SupportAccept';

describe('SupportAccept', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('shows an error when the ticket is missing', () => {
    render(
      <MemoryRouter initialEntries={['/support/accept']}>
        <SupportAccept />
      </MemoryRouter>,
    );

    expect(screen.getByText('Support ticket missing')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('exchanges the ticket once', async () => {
    render(
      <MemoryRouter initialEntries={['/support/accept?ticket=abc123']}>
        <SupportAccept />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate).toHaveBeenCalledWith('abc123', expect.any(Object));
  });
});
