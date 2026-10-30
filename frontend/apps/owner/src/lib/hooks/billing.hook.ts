import { useQuery } from '@tanstack/react-query';
import { getBillingMetrics, listTransactions } from '@/lib/action/billing.action';
import { ownerKeys } from '@/lib/query-keys';
import type { BillingMetricsParams, TransactionListParams } from '@/lib/types/billing.type';

export function useBillingMetrics(params: BillingMetricsParams = {}) {
  return useQuery({
    queryKey: ownerKeys.billingMetrics(params),
    queryFn: () => getBillingMetrics(params),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: ownerKeys.transactions(params),
    queryFn: () => listTransactions(params),
    staleTime: 0,
    gcTime: 0,
  });
}
