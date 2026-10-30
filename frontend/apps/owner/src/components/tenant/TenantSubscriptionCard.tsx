import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDateTime } from '@/lib/format';
import type { TenantSubscription } from '@/lib/types/tenant.type';

export default function TenantSubscriptionCard({
  subscription,
}: {
  subscription: TenantSubscription | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">{subscription.plan?.name ?? 'No plan'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{subscription.status.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Period ends</dt>
              <dd>{formatDateTime(subscription.current_period_end)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Cancels at end</dt>
              <dd>{subscription.cancel_at_period_end ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">This tenant has no subscription.</p>
        )}
      </CardContent>
    </Card>
  );
}
