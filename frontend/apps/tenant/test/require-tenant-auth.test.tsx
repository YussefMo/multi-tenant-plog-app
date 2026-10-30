import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';

const { useTenantMe } = vi.hoisted(() => ({ useTenantMe: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({ useTenantMe }));

import RequireTenantAuth from '@/layout/RequireTenantAuth';

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireTenantAuth>
              <div>protected tenant content</div>
            </RequireTenantAuth>
          }
        />
        <Route path="/login" element={<div>tenant login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireTenantAuth', () => {
  it('redirects unauthenticated users to login', () => {
    useTenantMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Unauthorized', 401),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('tenant login page')).toBeInTheDocument();
    expect(screen.queryByText('protected tenant content')).not.toBeInTheDocument();
  });

  it('renders protected content for an authenticated tenant user', () => {
    useTenantMe.mockReturnValue({
      data: {
        id: 1,
        role: 'admin',
        permissions: ['*'],
        name: 'Admin',
        email: 'admin@example.com',
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('protected tenant content')).toBeInTheDocument();
  });

  it('redirects forbidden sessions to login', () => {
    useTenantMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Forbidden', 403),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('tenant login page')).toBeInTheDocument();
  });
});
