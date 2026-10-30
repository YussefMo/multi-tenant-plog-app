import { AlertTriangle, CreditCard, DollarSign, Percent, TrendingUp, Wallet } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import type { BillingMetrics } from '@/lib/types/billing.type';

export default function BillingMetricGrid({ metrics }: { metrics: BillingMetrics }) {
  const currency = metrics.currency;

  return (
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
        hint={`${formatNumber(metrics.subscriptions.trialing)} trialing`}
        icon={CreditCard}
      />
      <MetricCard
        label="Past due"
        value={formatNumber(metrics.subscriptions.past_due)}
        hint={`${formatNumber(metrics.subscriptions.total)} total subscriptions`}
        icon={AlertTriangle}
        tone={metrics.subscriptions.past_due > 0 ? 'warning' : 'default'}
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
        icon={AlertTriangle}
        tone={metrics.disputes > 0 ? 'danger' : 'default'}
      />
    </div>
  );
}
