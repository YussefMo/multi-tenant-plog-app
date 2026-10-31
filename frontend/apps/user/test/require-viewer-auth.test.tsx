import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';

const { useViewerMe } = vi.hoisted(() => ({ useViewerMe: vi.fn() }));

vi.mock('@/lib/hooks/auth.hook', () => ({ useViewerMe }));

import RequireViewerAuth from '@/layout/RequireViewerAuth';

const originalLocation = window.location;

function mockLocation(assign: ReturnType<typeof vi.fn>) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { assign },
  });
}

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireViewerAuth>
              <div>protected viewer content</div>
            </RequireViewerAuth>
          }
        />
        <Route path="/login" element={<div>viewer login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireViewerAuth', () => {
  it('redirects unauthenticated users to login', () => {
    useViewerMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Unauthorized', 401),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('viewer login page')).toBeInTheDocument();
    expect(screen.queryByText('protected viewer content')).not.toBeInTheDocument();
  });

  it('renders protected content for a viewer', () => {
    useViewerMe.mockReturnValue({
      data: {
        id: 1,
        role: 'user',
        permissions: ['tenants.view'],
        name: 'Viewer',
        email: 'viewer@example.com',
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('protected viewer content')).toBeInTheDocument();
  });

  it('sends tenant admins and authors to the tenant client', () => {
    const assign = vi.fn();
    mockLocation(assign);

    useViewerMe.mockReturnValue({
      data: {
        id: 2,
        role: 'admin',
        permissions: ['*'],
        name: 'Admin',
        email: 'admin@example.com',
        redirect_url: 'http://localhost:3001',
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    renderGuard();

    expect(assign).toHaveBeenCalledWith('http://localhost:3001');
    expect(screen.queryByText('protected viewer content')).not.toBeInTheDocument();
  });

  it('redirects forbidden sessions to login', () => {
    useViewerMe.mockReturnValue({
      data: undefined,
      error: new ApiError('Forbidden', 403),
      isError: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText('viewer login page')).toBeInTheDocument();
  });
});
