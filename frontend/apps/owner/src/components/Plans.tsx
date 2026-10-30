import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PlanTable from '@/components/plan/PlanTable';
import { useDeletePlan, usePlans } from '@/lib/hooks/plan.hook';
import type { Plan } from '@/lib/types/plan.type';

export default function Plans() {
  const plansQuery = usePlans();
  const deletePlan = useDeletePlan();

  const remove = (plan: Plan) => {
    deletePlan.mutate(plan.id, {
      onSuccess: () => notify.success('Plan deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to delete plan.'),
    });
  };

  const pendingPlanId = deletePlan.isPending
    ? typeof deletePlan.variables === 'number'
      ? deletePlan.variables
      : deletePlan.variables
        ? Number(deletePlan.variables)
        : null
    : null;

  const createAction = (
    <Button asChild>
      <Link to="/plans/new">
        <Plus className="size-4" />
        Create plan
      </Link>
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Define subscription plans, pricing, limits, and Stripe price mappings."
        actions={createAction}
      />

      <Card className="overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <TableTally total={plansQuery.data?.length} entity="plans" actions={createAction} />
        </div>

        <div className="px-4 pb-4">
          {plansQuery.isError ? (
            <ErrorPanel error={plansQuery.error} onRetry={() => void plansQuery.refetch()} />
          ) : (
            <PlanTable
              plans={plansQuery.data ?? []}
              isLoading={plansQuery.isLoading}
              onDelete={remove}
              pendingPlanId={pendingPlanId}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
