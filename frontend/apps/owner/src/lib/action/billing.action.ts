import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type {
  BillingMetrics,
  BillingMetricsParams,
  BillingPayment,
  TransactionListParams,
} from '@/lib/types/billing.type';

export async function getBillingMetrics(
  params: BillingMetricsParams = {},
): Promise<BillingMetrics> {
  const { data } = await ownerApi.get<{ data: BillingMetrics }>('/owner/billing/metrics', {
    params,
  });

  return data.data;
}

export async function listTransactions(
  params: TransactionListParams = {},
): Promise<PaginatedResponse<BillingPayment>> {
  const { data } = await ownerApi.get<PaginatedResponse<BillingPayment>>(
    '/owner/billing/transactions',
    { params },
  );

  return data;
}
