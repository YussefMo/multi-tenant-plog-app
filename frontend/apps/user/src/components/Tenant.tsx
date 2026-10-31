import { FileText } from 'lucide-react';
import {
  SearchField,
  Spinner,
  TableFooter,
} from '@multi-tenant-plog/shared/components/components-parts';
import { useParams, useSearchParams } from '@multi-tenant-plog/shared/lib/router';
import { Skeleton } from '@multi-tenant-plog/shared/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorPanel from '@/components/ErrorPanel';
import PostCard from '@/components/post/PostCard';
import TenantHeader from '@/components/tenant/TenantHeader';
import { useTenantDirectory, useTenantPosts } from '@/lib/hooks/directory.hook';

function PostsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-40" />
      ))}
    </div>
  );
}

export default function Tenant() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const tenant = useTenantDirectory(tenantId);
  const posts = useTenantPosts(tenantId, {
    search: search || undefined,
    page,
    per_page: 9,
  });

  if (tenant.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (tenant.isError || !tenant.data) {
    return <ErrorPanel error={tenant.error} onRetry={() => void tenant.refetch()} />;
  }

  return (
    <div>
      <TenantHeader tenant={tenant.data} />

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
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No published posts"
          description={
            search
              ? 'No published posts match this search.'
              : 'This tenant has not published any posts yet.'
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
