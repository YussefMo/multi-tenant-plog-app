import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
import type { CreatePlanPayload, Plan, UpdatePlanPayload } from '@/lib/types/plan.type';

export async function listPlans(): Promise<Plan[]> {
  const { data } = await ownerApi.get<{ data: Plan[] }>('/owner/plans');

  return data.data;
}

export async function getPlan(planId: number | string): Promise<Plan> {
  const { data } = await ownerApi.get<{ data: Plan }>(`/owner/plans/${planId}`);

  return data.data;
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const { data } = await ownerApi.post<{ data: Plan }>('/owner/plans', payload);

  return data.data;
}

export async function updatePlan(
  planId: number | string,
  payload: UpdatePlanPayload,
): Promise<Plan> {
  const { data } = await ownerApi.patch<{ data: Plan }>(`/owner/plans/${planId}`, payload);

  return data.data;
}

export async function deletePlan(planId: number | string): Promise<void> {
  await ownerApi.delete(`/owner/plans/${planId}`);
}
