import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type {
  CreateTenantPayload,
  CreateTenantResult,
  SupportAccessResult,
  Tenant,
  TenantDetail,
  TenantListParams,
  TenantPurge,
  UpdateTenantPayload,
} from '@/lib/types/tenant.type';

export async function listTenants(
  params: TenantListParams = {},
): Promise<PaginatedResponse<Tenant>> {
  const { data } = await ownerApi.get<PaginatedResponse<Tenant>>('/owner/tenants', { params });

  return data;
}

export async function getTenant(tenantId: number | string): Promise<TenantDetail> {
  const { data } = await ownerApi.get<{ data: TenantDetail }>(`/owner/tenants/${tenantId}`);

  return data.data;
}

export async function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResult> {
  const { data } = await ownerApi.post<CreateTenantResult>('/owner/tenants', payload);

  return data;
}

export async function updateTenant(
  tenantId: number | string,
  payload: UpdateTenantPayload,
): Promise<Tenant> {
  const { data } = await ownerApi.patch<{ data: Tenant }>(`/owner/tenants/${tenantId}`, payload);

  return data.data;
}

export async function deleteTenant(tenantId: number | string): Promise<void> {
  await ownerApi.delete(`/owner/tenants/${tenantId}`);
}

export async function restoreTenant(tenantId: number | string): Promise<Tenant> {
  const { data } = await ownerApi.post<{ data: Tenant }>(`/owner/tenants/${tenantId}/restore`);

  return data.data;
}

export async function forceDeleteTenant(tenantId: number | string): Promise<void> {
  await ownerApi.delete(`/owner/tenants/${tenantId}/force`);
}

export async function listPurgedTenants(
  params: { page?: number } = {},
): Promise<PaginatedResponse<TenantPurge>> {
  const { data } = await ownerApi.get<PaginatedResponse<TenantPurge>>('/owner/tenants/purged', {
    params,
  });

  return data;
}

export async function createSupportAccess(tenantId: number | string): Promise<SupportAccessResult> {
  const { data } = await ownerApi.post<SupportAccessResult>(`/owner/tenants/${tenantId}/access`);

  return data;
}
