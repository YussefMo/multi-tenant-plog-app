import { Check } from 'lucide-react';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatCurrency } from '@/lib/format';
import type { Plan } from '@/lib/types/billing.type';

interface PlanCardsProps {
  plans: Plan[];
  onCheckout: (plan: Plan) => void;
  isPending?: boolean;
  pendingPlanId?: number | null;
}

export default function PlanCards({
  plans,
  onCheckout,
  isPending = false,
  pendingPlanId = null,
}: PlanCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {formatCurrency(plan.amount, plan.currency)} / {plan.interval}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-1.5 text-sm">
              {plan.features.length === 0 ? (
                <li className="text-muted-foreground">No features listed.</li>
              ) : (
                plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-500" />
                    {feature}
                  </li>
                ))
              )}
            </ul>
            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={() => onCheckout(plan)}
            >
              {isPending && pendingPlanId === plan.id ? 'Starting checkout…' : 'Choose plan'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
