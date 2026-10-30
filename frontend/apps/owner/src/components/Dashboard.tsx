import {
  AlertTriangle,
  Building2,
  CreditCard,
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/dashboard/MetricCard';
import PlanDistributionChart from '@/components/dashboard/PlanDistributionChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import RevenueByTenantTable from '@/components/dashboard/RevenueByTenantTable';
import RevenueTimelineChart from '@/components/dashboard/RevenueTimelineChart';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { useBillingMetrics, useTransactions } from '@/lib/hooks/billing.hook';
import { useTenants } from '@/lib/hooks/tenant.hook';

export default function Dashboard() {
  const metricsQuery = useBillingMetrics();
  const tenantsQuery = useTenants({ per_page: 1 });
  const transactionsQuery = useTransactions({ per_page: 5 });

  if (metricsQuery.isLoading) {
    return <Spinner />;
  }

  if (metricsQuery.isError || !metricsQuery.data) {
    return (
      <ErrorPanel
        error={metricsQuery.error ?? new Error('Unable to load dashboard metrics.')}
        onRetry={() => void metricsQuery.refetch()}
      />
    );
  }

  const metrics = metricsQuery.data;
  const currency = metrics.currency;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Revenue, subscriptions, and tenant health at a glance."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/tenants/new">New tenant</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/plans/new">New plan</Link>
            </Button>
            <Button asChild>
              <Link to="/billing">Open billing</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="MRR"
          value={formatCurrency(metrics.mrr, currency)}
          hint={`${formatCurrency(metrics.arr, currency)} ARR`}
          icon={TrendingUp}
        />
        <MetricCard
          label="Gross revenue"
          value={formatCurrency(metrics.revenue.gross, currency)}
          hint={`${formatCurrency(metrics.revenue.refunds, currency)} refunds`}
          icon={Wallet}
          tone="positive"
        />
        <MetricCard
          label="Net revenue"
          value={formatCurrency(metrics.revenue.net, currency)}
          hint="Collected minus refunds"
          icon={DollarSign}
          tone="positive"
        />
        <MetricCard
          label="Churn rate"
          value={formatPercent(metrics.churn_rate)}
          hint={`${formatNumber(metrics.subscriptions.canceled)} canceled`}
          icon={Percent}
          tone={metrics.churn_rate > 10 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Active subscriptions"
          value={formatNumber(metrics.subscriptions.active)}
          hint={`${formatNumber(metrics.subscriptions.total)} total`}
          icon={CreditCard}
        />
        <MetricCard
          label="Tenants"
          value={formatNumber(tenantsQuery.data?.meta.total ?? 0)}
          hint="Owned by you"
          icon={Building2}
        />
        <MetricCard
          label="Failed payments"
          value={formatNumber(metrics.failed_payments)}
          hint="In the selected period"
          icon={AlertTriangle}
          tone={metrics.failed_payments > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          label="Disputes"
          value={formatNumber(metrics.disputes)}
          hint="In the selected period"
          icon={Users}
          tone={metrics.disputes > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue timeline</CardTitle>
            <CardDescription>Gross, refunds, and net revenue by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTimelineChart timeline={metrics.timeline} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
            <CardDescription>Active subscriptions by plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDistributionChart entries={metrics.plan_distribution} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden py-0">
          <CardHeader className="p-4">
            <CardTitle>Revenue by tenant</CardTitle>
            <CardDescription>Collected revenue in the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <RevenueByTenantTable entries={metrics.revenue_by_tenant} currency={currency} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden py-0">
          <CardHeader className="p-4">
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>The latest billing payments.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <RecentTransactions
              transactions={transactionsQuery.data?.data ?? []}
              isLoading={transactionsQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
