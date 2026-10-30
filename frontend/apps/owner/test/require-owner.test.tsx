import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';

const { useOwnerMe } = vi.hoisted(() => ({ useOwnerMe: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({ useOwnerMe }));

import RequireOwner from '@/layout/RequireOwner';

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireOwner>
              <div>protected content</div>
            </RequireOwner>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireOwner', () => {
  it('redirects unauthenticated owners to login', () => {
    useOwnerMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Unauthorized', 401),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders protected content for an authenticated owner', () => {
    useOwnerMe.mockReturnValue({
      data: { id: 1, name: 'Owner', email: 'owner@example.com' },
      error: null,
      isError: false,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('shows an access denied state for forbidden owners', () => {
    useOwnerMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Forbidden', 403),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });
});
