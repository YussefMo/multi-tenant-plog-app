import { Building2, FileText, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import RecentBillingTable from '@/components/dashboard/RecentBillingTable';
import RecentPostsTable from '@/components/dashboard/RecentPostsTable';
import SubscriptionSummaryCard from '@/components/dashboard/SubscriptionSummaryCard';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useInvoices, usePayments } from '@/lib/hooks/billing.hook';
import { usePosts } from '@/lib/hooks/post.hook';
import { useTenantOverview } from '@/lib/hooks/tenant.hook';

export default function Dashboard() {
  const { data: user } = useTenantMe();
  const overviewQuery = useTenantOverview();
  const postsQuery = usePosts({ per_page: 5 });
  const canViewBilling = hasPermission(user, 'billing.view');
  const invoicesQuery = useInvoices({ per_page: 5 }, { enabled: canViewBilling });
  const paymentsQuery = usePayments({ per_page: 5 }, { enabled: canViewBilling });

  if (overviewQuery.isLoading) {
    return <Spinner />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <ErrorPanel
        error={overviewQuery.error ?? new Error('Unable to load the tenant overview.')}
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${overview.tenant.name}${overview.tenant.category ? ` · ${overview.tenant.category}` : ''}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/posts/new">New post</Link>
            </Button>
            {hasPermission(user, 'users.create') ? (
              <Button asChild variant="outline">
                <Link to="/users/new">Invite user</Link>
              </Button>
            ) : null}
            {canViewBilling ? (
              <Button asChild>
                <Link to="/billing">Billing</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {overview.tenant.is_due ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border px-4 py-3 text-sm">
          This tenant is marked as due. Access is not blocked, but billing needs attention.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Posts"
          value={String(overview.counts.posts.total)}
          hint={`${overview.counts.posts.published} published · ${overview.counts.posts.draft} draft`}
          icon={FileText}
        />
        {overview.counts.users !== null ? (
          <MetricCard
            label="Users"
            value={String(overview.counts.users)}
            hint="Admins and authors"
            icon={Users}
          />
        ) : null}
        {overview.counts.profiles !== null ? (
          <MetricCard
            label="Profiles"
            value={String(overview.counts.profiles)}
            hint="Permission profiles"
            icon={ShieldCheck}
          />
        ) : null}
        <MetricCard
          label="Support access"
          value={overview.tenant.allow_support ? 'Enabled' : 'Disabled'}
          hint="Owner support sessions"
          icon={Building2}
          tone={overview.tenant.allow_support ? 'positive' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="overflow-hidden py-0">
            <CardHeader className="p-4">
              <CardTitle>Recent posts</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <RecentPostsTable
                posts={postsQuery.data?.data ?? []}
                isLoading={postsQuery.isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {canViewBilling ? <SubscriptionSummaryCard subscription={overview.subscription} /> : null}
      </div>

      {canViewBilling ? (
        <Card className="mt-4 overflow-hidden py-0">
          <CardHeader className="p-4">
            <CardTitle>Recent billing</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <RecentBillingTable
              invoices={invoicesQuery.data?.data ?? []}
              payments={paymentsQuery.data?.data ?? []}
              isLoading={invoicesQuery.isLoading || paymentsQuery.isLoading}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
