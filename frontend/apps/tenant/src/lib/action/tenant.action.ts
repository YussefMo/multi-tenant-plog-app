import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { TenantSummary } from '@/lib/types/auth.type';
import type { TenantOverview, UpdateTenantPayload } from '@/lib/types/tenant.type';

export async function getTenant(): Promise<TenantSummary> {
  const { data } = await tenantApi.get<{ data: TenantSummary }>('/tenant');

  return data.data;
}

export async function updateTenant(payload: UpdateTenantPayload): Promise<TenantSummary> {
  const { data } = await tenantApi.patch<{ data: TenantSummary }>('/tenant', payload);

  return data.data;
}

export async function getTenantOverview(): Promise<TenantOverview> {
  const { data } = await tenantApi.get<{ data: TenantOverview }>('/tenant/overview');

  return data.data;
}
