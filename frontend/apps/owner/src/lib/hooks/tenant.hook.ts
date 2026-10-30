import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSupportAccess,
  createTenant,
  deleteTenant,
  forceDeleteTenant,
  getTenant,
  listPurgedTenants,
  listTenants,
  restoreTenant,
  updateTenant,
} from '@/lib/action/tenant.action';
import { ownerKeys } from '@/lib/query-keys';
import type {
  CreateTenantPayload,
  TenantListParams,
  UpdateTenantPayload,
} from '@/lib/types/tenant.type';

const tenantsRoot = ['owner', 'tenants'] as const;

function useInvalidateTenants() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: tenantsRoot });
    void queryClient.invalidateQueries({ queryKey: ownerKeys.billingMetrics() });
  };
}

export function useTenants(params: TenantListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ownerKeys.tenants(params),
    queryFn: () => listTenants(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTenant(tenantId: number | string | undefined) {
  return useQuery({
    queryKey: ownerKeys.tenant(tenantId ?? ''),
    queryFn: () => getTenant(tenantId as number | string),
    enabled: Boolean(tenantId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePurgedTenants(
  params: { page?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ownerKeys.purged(params),
    queryFn: () => listPurgedTenants(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateTenant() {
  const invalidate = useInvalidateTenants();

  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => createTenant(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTenant(tenantId: number | string) {
  const invalidate = useInvalidateTenants();

  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => updateTenant(tenantId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTenant() {
  const invalidate = useInvalidateTenants();

  return useMutation({
    mutationFn: (tenantId: number | string) => deleteTenant(tenantId),
    onSuccess: invalidate,
  });
}

export function useRestoreTenant() {
  const invalidate = useInvalidateTenants();

  return useMutation({
    mutationFn: (tenantId: number | string) => restoreTenant(tenantId),
    onSuccess: invalidate,
  });
}

export function useForceDeleteTenant() {
  const invalidate = useInvalidateTenants();

  return useMutation({
    mutationFn: (tenantId: number | string) => forceDeleteTenant(tenantId),
    onSuccess: invalidate,
  });
}

export function useSupportAccess() {
  return useMutation({
    mutationFn: (tenantId: number | string) => createSupportAccess(tenantId),
  });
}
