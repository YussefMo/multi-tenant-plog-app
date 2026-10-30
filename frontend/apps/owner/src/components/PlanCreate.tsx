import { useNavigate } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import PageHeader from '@/components/PageHeader';
import PlanForm from '@/components/plan/PlanForm';
import { useCreatePlan } from '@/lib/hooks/plan.hook';
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

export default function PlanCreate() {
  const navigate = useNavigate();
  const createPlan = useCreatePlan();

  const submit = (payload: CreatePlanPayload | UpdatePlanPayload) => {
    createPlan.mutate(payload as CreatePlanPayload, {
      onSuccess: () => {
        notify.success('Plan created.');
        navigate('/plans');
      },
      onError: (error) => notify.apiError(error, 'Unable to create plan.'),
    });
  };

  return (
    <div>
      <PageHeader title="Create plan" description="Add a new subscription plan." />
      <PlanForm
        onSubmit={submit}
        isPending={createPlan.isPending}
        errors={fieldErrors(createPlan.error)}
      />
    </div>
  );
}
