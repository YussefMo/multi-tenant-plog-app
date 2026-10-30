import { useNavigate } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PlanCards from '@/components/billing/PlanCards';
import { useCheckout, usePlans } from '@/lib/hooks/billing.hook';
import type { Plan } from '@/lib/types/billing.type';

export default function BillingPlans() {
  const navigate = useNavigate();
  const plansQuery = usePlans();
  const checkout = useCheckout();

  if (plansQuery.isLoading) {
    return <Spinner />;
  }

  if (plansQuery.isError) {
    return <ErrorPanel error={plansQuery.error} onRetry={() => void plansQuery.refetch()} />;
  }

  const handleCheckout = (plan: Plan) => {
    checkout.mutate(plan.id, {
      onSuccess: (result) => {
        window.location.assign(result.checkout_url);
      },
      onError: (error) => notify.apiError(error, 'Unable to start checkout.'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Choose a plan for this tenant."
        actions={
          <button
            type="button"
            className="text-primary text-sm underline"
            onClick={() => navigate('/billing')}
          >
            Back to billing
          </button>
        }
      />
      <PlanCards
        plans={plansQuery.data ?? []}
        onCheckout={handleCheckout}
        isPending={checkout.isPending}
        pendingPlanId={
          checkout.isPending && typeof checkout.variables === 'number' ? checkout.variables : null
        }
      />
    </div>
  );
}
