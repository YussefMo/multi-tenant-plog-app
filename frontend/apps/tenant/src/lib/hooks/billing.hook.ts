import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSubscription,
  checkout,
  getSubscription,
  listInvoices,
  listPayments,
  listPlans,
  portal,
} from '@/lib/action/billing.action';
import { tenantKeys } from '@/lib/query-keys';
import type { BillingListParams } from '@/lib/types/billing.type';

function useInvalidateBilling() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: tenantKeys.subscription });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.invoices() });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.payments() });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.overview });
  };
}

export function usePlans() {
  return useQuery({
    queryKey: tenantKeys.plans,
    queryFn: listPlans,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: tenantKeys.subscription,
    queryFn: getSubscription,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useInvoices(params: BillingListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tenantKeys.invoices(params),
    queryFn: () => listInvoices(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePayments(params: BillingListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tenantKeys.payments(params),
    queryFn: () => listPayments(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCheckout() {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: (planId: number) => checkout(planId),
    onSuccess: invalidate,
  });
}

export function usePortal() {
  return useMutation({ mutationFn: portal });
}

export function useCancelSubscription() {
  const invalidate = useInvalidateBilling();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: invalidate,
  });
}
