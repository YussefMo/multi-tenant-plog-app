import { Newspaper } from 'lucide-react';
import { SearchField, TableFooter } from '@multi-tenant-plog/shared/components/components-parts';
import { useSearchParams } from '@multi-tenant-plog/shared/lib/router';
import { Skeleton } from '@multi-tenant-plog/shared/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PostCard from '@/components/post/PostCard';
import { usePosts } from '@/lib/hooks/post.hook';

function PostsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-40" />
      ))}
    </div>
  );
}

export default function Posts() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const posts = usePosts({
    search: search || undefined,
    page,
    per_page: 12,
  });

  return (
    <div>
      <PageHeader
        title="Latest posts"
        description="Published posts from every tenant on the platform."
      />

      <div className="mb-4">
        <SearchField placeholder="Search published posts" />
      </div>

      {posts.isLoading ? (
        <PostsSkeleton />
      ) : posts.isError ? (
        <ErrorPanel error={posts.error} onRetry={() => void posts.refetch()} />
      ) : posts.data && posts.data.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.data.data.map((post) => (
            <PostCard key={post.id} post={post} showTenant />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="No published posts"
          description={
            search
              ? 'No published posts match this search.'
              : 'Published posts will appear here once tenants publish them.'
          }
        />
      )}

      {posts.data && posts.data.meta.last_page > 1 ? (
        <TableFooter
          totalPages={posts.data.meta.last_page}
          from={posts.data.meta.from}
          to={posts.data.meta.to}
          total={posts.data.meta.total}
        />
      ) : null}
    </div>
  );
}
