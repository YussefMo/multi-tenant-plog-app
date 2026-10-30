import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import PlanForm from '@/components/plan/PlanForm';
import { usePlan, useUpdatePlan } from '@/lib/hooks/plan.hook';
import type { CreatePlanPayload, UpdatePlanPayload } from '@/lib/types/plan.type';

function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Invalid value.',
    ]),
  );
}

export default function PlanEdit() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const planQuery = usePlan(planId);
  const updatePlan = useUpdatePlan(planId ?? '');

  if (planQuery.isLoading) {
    return <Spinner />;
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <ErrorPanel
        error={planQuery.error ?? new Error('Plan not found.')}
        onRetry={() => void planQuery.refetch()}
      />
    );
  }

  const submit = (payload: CreatePlanPayload | UpdatePlanPayload) => {
    updatePlan.mutate(payload as UpdatePlanPayload, {
      onSuccess: () => {
        notify.success('Plan updated.');
        navigate('/plans');
      },
      onError: (error) => notify.apiError(error, 'Unable to update plan.'),
    });
  };

  return (
    <div>
      <PageHeader title="Edit plan" description={`Update ${planQuery.data.name}.`} />
      <PlanForm
        initialPlan={planQuery.data}
        onSubmit={submit}
        isPending={updatePlan.isPending}
        errors={fieldErrors(updatePlan.error)}
      />
    </div>
  );
}
