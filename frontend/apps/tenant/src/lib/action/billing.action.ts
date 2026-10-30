import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type {
  BillingInvoice,
  BillingListParams,
  BillingPayment,
  CheckoutResult,
  Plan,
  PortalResult,
  Subscription,
} from '@/lib/types/billing.type';

export async function listPlans(): Promise<Plan[]> {
  const { data } = await tenantApi.get<{ data: Plan[] }>('/billing/plans');

  return data.data;
}

export async function getSubscription(): Promise<Subscription | null> {
  const { data } = await tenantApi.get<{ data: Subscription | null }>('/billing/subscription');

  return data.data;
}

export async function listInvoices(
  params: BillingListParams = {},
): Promise<PaginatedResponse<BillingInvoice>> {
  const { data } = await tenantApi.get<PaginatedResponse<BillingInvoice>>('/billing/invoices', {
    params,
  });

  return data;
}

export async function listPayments(
  params: BillingListParams = {},
): Promise<PaginatedResponse<BillingPayment>> {
  const { data } = await tenantApi.get<PaginatedResponse<BillingPayment>>('/billing/payments', {
    params,
  });

  return data;
}

export async function checkout(planId: number): Promise<CheckoutResult> {
  const { data } = await tenantApi.post<CheckoutResult>('/billing/checkout', { plan_id: planId });

  return data;
}

export async function startTrial(): Promise<Subscription> {
  const { data } = await tenantApi.post<{ data: Subscription }>('/billing/trial');

  return data.data;
}

export async function portal(): Promise<PortalResult> {
  const { data } = await tenantApi.post<PortalResult>('/billing/portal');

  return data;
}

export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await tenantApi.post<{ data: Subscription }>('/billing/cancel');

  return data.data;
}
