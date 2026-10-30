import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTenant, getTenantOverview, updateTenant } from '@/lib/action/tenant.action';
import { tenantKeys } from '@/lib/query-keys';
import type { UpdateTenantPayload } from '@/lib/types/tenant.type';

export function useTenant() {
  return useQuery({
    queryKey: tenantKeys.tenant,
    queryFn: getTenant,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTenantOverview() {
  return useQuery({
    queryKey: tenantKeys.overview,
    queryFn: getTenantOverview,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => updateTenant(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tenantKeys.tenant });
      void queryClient.invalidateQueries({ queryKey: tenantKeys.overview });
    },
  });
}
