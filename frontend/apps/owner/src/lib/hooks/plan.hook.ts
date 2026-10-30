import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPlan, deletePlan, getPlan, listPlans, updatePlan } from '@/lib/action/plan.action';
import { ownerKeys } from '@/lib/query-keys';
import type { CreatePlanPayload, UpdatePlanPayload } from '@/lib/types/plan.type';

const plansRoot = ['owner', 'plans'] as const;

function useInvalidatePlans() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: plansRoot });
    void queryClient.invalidateQueries({ queryKey: ownerKeys.billingMetrics() });
  };
}

export function usePlans() {
  return useQuery({
    queryKey: ownerKeys.plans,
    queryFn: listPlans,
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePlan(planId: number | string | undefined) {
  return useQuery({
    queryKey: ownerKeys.plan(planId ?? ''),
    queryFn: () => getPlan(planId as number | string),
    enabled: Boolean(planId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans();

  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => createPlan(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePlan(planId: number | string) {
  const invalidate = useInvalidatePlans();

  return useMutation({
    mutationFn: (payload: UpdatePlanPayload) => updatePlan(planId, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePlan() {
  const invalidate = useInvalidatePlans();

  return useMutation({
    mutationFn: (planId: number | string) => deletePlan(planId),
    onSuccess: invalidate,
  });
}
