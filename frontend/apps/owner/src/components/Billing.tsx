import { useSearchParams } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import BillingMetricGrid from '@/components/billing/BillingMetricGrid';
import DateRangeFilter from '@/components/billing/DateRangeFilter';
import PlanDistributionChart from '@/components/billing/PlanDistributionChart';
import RevenueByTenantTable from '@/components/billing/RevenueByTenantTable';
import RevenueTimelineChart from '@/components/billing/RevenueTimelineChart';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import { formatNumber, titleCase } from '@/lib/format';
import { useBillingMetrics } from '@/lib/hooks/billing.hook';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const metricsQuery = useBillingMetrics({ from, to });

  if (metricsQuery.isLoading) {
    return <Spinner />;
  }

  if (metricsQuery.isError || !metricsQuery.data) {
    return (
      <ErrorPanel
        error={metricsQuery.error ?? new Error('Unable to load billing metrics.')}
        onRetry={() => void metricsQuery.refetch()}
      />
    );
  }

  const metrics = metricsQuery.data;

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Revenue, subscription health, and plan performance."
      />

      <Card className="mb-4 py-4">
        <CardContent className="px-4">
          <DateRangeFilter />
        </CardContent>
      </Card>

      <BillingMetricGrid metrics={metrics} />

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue timeline</CardTitle>
            <CardDescription>Gross, refunds, and net revenue by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTimelineChart timeline={metrics.timeline} currency={metrics.currency} />
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

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden py-0 xl:col-span-2">
          <CardHeader className="p-4">
            <CardTitle>Revenue by tenant</CardTitle>
            <CardDescription>Collected revenue in the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <RevenueByTenantTable entries={metrics.revenue_by_tenant} currency={metrics.currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment statuses</CardTitle>
            <CardDescription>Payments in the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.payment_status_counts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{titleCase(status)}</span>
                <span className="font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
