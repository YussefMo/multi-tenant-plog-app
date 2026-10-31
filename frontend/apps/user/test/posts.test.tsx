import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postsMock } = vi.hoisted(() => ({ postsMock: vi.fn() }));

vi.mock('@/lib/hooks/post.hook', () => ({ usePosts: postsMock }));

import Posts from '@/components/Posts';
import { renderViewer } from './utils';

const posts = {
  data: [
    {
      id: 10,
      tenant_id: 1,
      title: 'Global post',
      slug: 'global-post',
      body: 'Body text',
      status: 'published',
      published_at: '2026-10-01T10:00:00+00:00',
      author: { id: 1, name: 'Author', role: 'author' },
      tenant: { id: 1, name: 'Acme' },
      created_at: null,
      updated_at: null,
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, to: 1, last_page: 1, total: 1 },
};

describe('Latest posts', () => {
  beforeEach(() => {
    postsMock.mockReturnValue({
      data: posts,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders published posts with their tenant', () => {
    renderViewer(<Posts />);

    expect(screen.getByText('Latest posts')).toBeInTheDocument();
    expect(screen.getByText('Global post')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is published', () => {
    postsMock.mockReturnValue({
      data: {
        data: [],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: null, to: null, last_page: 1, total: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderViewer(<Posts />);

    expect(screen.getByText('No published posts')).toBeInTheDocument();
  });
});
