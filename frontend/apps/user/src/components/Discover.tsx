import { Building2, FileText, Inbox, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FilterSelect,
  SearchField,
  TableFooter,
} from '@multi-tenant-plog/shared/components/components-parts';
import { useSearchParams } from '@multi-tenant-plog/shared/lib/router';
import { Skeleton } from '@multi-tenant-plog/shared/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/discover/MetricCard';
import RecentPostsList from '@/components/discover/RecentPostsList';
import TenantCard from '@/components/discover/TenantCard';
import { formatNumber } from '@/lib/format';
import { useTenants, useViewerOverview } from '@/lib/hooks/directory.hook';

function TenantGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-36" />
      ))}
    </div>
  );
}

export default function Discover() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);

  const overview = useViewerOverview();
  const tenants = useTenants({
    search: search || undefined,
    category: category || undefined,
    page,
    per_page: 12,
  });

  const categories = (overview.data?.categories ?? []).map((value) => ({
    value,
    label: value,
  }));

  return (
    <div>
      <PageHeader
        title="Discover"
        description="Browse tenants and read their latest published posts."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {overview.isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <MetricCard
              icon={Building2}
              label="Tenants"
              value={formatNumber(overview.data?.counts.tenants ?? 0)}
            />
            <MetricCard
              icon={FileText}
              label="Published posts"
              value={formatNumber(overview.data?.counts.published_posts ?? 0)}
            />
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search tenants or categories" />
        <FilterSelect
          options={categories}
          paramKey="category"
          placeholder="All categories"
          className="w-48"
        />
      </div>

      <div className="mt-4">
        {tenants.isLoading ? (
          <TenantGridSkeleton />
        ) : tenants.isError ? (
          <ErrorPanel error={tenants.error} onRetry={() => void tenants.refetch()} />
        ) : tenants.data && tenants.data.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.data.data.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No tenants found"
            description="Try a different search or category."
          />
        )}
      </div>

      {tenants.data && tenants.data.meta.last_page > 1 ? (
        <TableFooter
          totalPages={tenants.data.meta.last_page}
          from={tenants.data.meta.from}
          to={tenants.data.meta.to}
          total={tenants.data.meta.total}
        />
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent posts</h3>
          <Link to="/posts" className="text-primary text-sm font-medium hover:underline">
            View all
          </Link>
        </div>

        {overview.isError ? (
          <ErrorPanel error={overview.error} onRetry={() => void overview.refetch()} />
        ) : overview.isLoading ? (
          <Skeleton className="h-48" />
        ) : overview.data && overview.data.recent_posts.length > 0 ? (
          <RecentPostsList posts={overview.data.recent_posts} />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No published posts yet"
            description="Published posts from every tenant will appear here."
          />
        )}
      </section>
    </div>
  );
}
