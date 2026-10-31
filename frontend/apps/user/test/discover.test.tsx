import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { overviewMock, tenantsMock } = vi.hoisted(() => ({
  overviewMock: vi.fn(),
  tenantsMock: vi.fn(),
}));

vi.mock('@/lib/hooks/directory.hook', () => ({
  useViewerOverview: overviewMock,
  useTenants: tenantsMock,
}));

import Discover from '@/components/Discover';
import { renderViewer } from './utils';

const overview = {
  counts: { tenants: 3, published_posts: 12 },
  categories: ['Technology'],
  recent_tenants: [],
  recent_posts: [
    {
      id: 9,
      title: 'Hello world',
      slug: 'hello-world',
      published_at: '2026-10-01T10:00:00+00:00',
      author: { id: 1, name: 'Author' },
      tenant: { id: 1, name: 'Acme' },
    },
  ],
};

const tenants = {
  data: [{ id: 1, name: 'Acme', category: 'Technology', published_posts_count: 5 }],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, to: 1, last_page: 1, total: 1 },
};

function query<T>(data: T) {
  return { data, isLoading: false, isError: false, error: null, refetch: vi.fn() };
}

describe('Discover', () => {
  beforeEach(() => {
    overviewMock.mockReturnValue(query(overview));
    tenantsMock.mockReturnValue(query(tenants));
  });

  it('renders metrics, tenant cards, and recent posts', () => {
    renderViewer(<Discover />);

    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows an empty state when no tenants match', () => {
    tenantsMock.mockReturnValue(
      query({
        data: [],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: null, to: null, last_page: 1, total: 0 },
      }),
    );

    renderViewer(<Discover />);

    expect(screen.getByText('No tenants found')).toBeInTheDocument();
  });
});
