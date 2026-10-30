import { CalendarClock, CreditCard } from 'lucide-react';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDate } from '@/lib/format';
import type { TenantOverview } from '@/lib/types/tenant.type';

export default function SubscriptionSummaryCard({
  subscription,
}: {
  subscription: TenantOverview['subscription'];
}) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No subscription yet. Choose a plan from Billing.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Subscription</CardTitle>
        <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
          {subscription.status.replace(/_/g, ' ')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="text-muted-foreground size-4" />
          <span className="font-medium">{subscription.plan?.name ?? 'No plan'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="text-muted-foreground size-4" />
          <span className="text-muted-foreground">
            {subscription.trial_ends_at
              ? `Trial ends ${formatDate(subscription.trial_ends_at)}`
              : `Renews ${formatDate(subscription.current_period_end)}`}
          </span>
        </div>
        {subscription.cancel_at_period_end ? (
          <p className="text-amber-600 dark:text-amber-400">
            Cancels at the end of the current period.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
