import { CalendarClock, CreditCard, ExternalLink, XCircle } from 'lucide-react';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDate } from '@/lib/format';
import type { Subscription } from '@/lib/types/billing.type';

interface SubscriptionCardProps {
  subscription: Subscription | null;
  onPortal?: () => void;
  onCancel?: () => void;
  isPortalPending?: boolean;
  isCancelPending?: boolean;
}

export default function SubscriptionCard({
  subscription,
  onPortal,
  onCancel,
  isPortalPending = false,
  isCancelPending = false,
}: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          No subscription yet. Choose a plan to start billing.
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
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="text-muted-foreground size-4" />
          <span className="font-medium">{subscription.plan?.name ?? 'No plan'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className="text-muted-foreground size-4" />
          <span className="text-muted-foreground">
            {subscription.trial_ends_at
              ? `Trial ends ${formatDate(subscription.trial_ends_at)}`
              : `Current period ends ${formatDate(subscription.current_period_end)}`}
          </span>
        </div>
        {subscription.cancel_at_period_end ? (
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            Cancels at the end of the current period.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {onPortal ? (
            <Button variant="outline" disabled={isPortalPending} onClick={onPortal}>
              <ExternalLink className="size-4" />
              Billing portal
            </Button>
          ) : null}
          {onCancel && subscription.status !== 'canceled' ? (
            <Button variant="outline" disabled={isCancelPending} onClick={onCancel}>
              <XCircle className="size-4" />
              Cancel subscription
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
