import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@multi-tenant-plog/shared/providers';

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock('@/lib/hooks/post.hook', () => ({ usePost: postMock }));

import PostDetail from '@/components/PostDetail';

function renderPostDetail() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <MemoryRouter initialEntries={['/posts/10']}>
          <Routes>
            <Route path="/posts/:postId" element={<PostDetail />} />
          </Routes>
        </MemoryRouter>
      </AppProviders>
    </QueryClientProvider>,
  );
}

describe('Post detail', () => {
  it('renders the post, tenant, and author', () => {
    postMock.mockReturnValue({
      data: {
        id: 10,
        tenant_id: 1,
        title: 'Detailed post',
        slug: 'detailed-post',
        body: 'The full body of the post.',
        status: 'published',
        published_at: '2026-10-01T10:00:00+00:00',
        author: { id: 1, name: 'Author', role: 'author' },
        tenant: { id: 1, name: 'Acme' },
        created_at: null,
        updated_at: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPostDetail();

    expect(screen.getByText('Detailed post')).toBeInTheDocument();
    expect(screen.getByText('The full body of the post.')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
  });
});
