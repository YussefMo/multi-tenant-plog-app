import { useQuery } from '@tanstack/react-query';
import {
  getDirectoryTenant,
  getViewerOverview,
  listDirectoryTenants,
  listTenantPosts,
} from '@/lib/action/directory.action';
import { viewerKeys } from '@/lib/query-keys';
import type { TenantListParams } from '@/lib/types/directory.type';
import type { PostListParams } from '@/lib/types/post.type';

export function useViewerOverview() {
  return useQuery({
    queryKey: viewerKeys.overview,
    queryFn: getViewerOverview,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTenants(params: TenantListParams = {}) {
  return useQuery({
    queryKey: viewerKeys.tenants(params),
    queryFn: () => listDirectoryTenants(params),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTenantDirectory(tenantId: number | string | undefined) {
  return useQuery({
    queryKey: viewerKeys.tenant(tenantId ?? ''),
    queryFn: () => getDirectoryTenant(tenantId as number | string),
    enabled: Boolean(tenantId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTenantPosts(tenantId: number | string | undefined, params: PostListParams = {}) {
  return useQuery({
    queryKey: viewerKeys.tenantPosts(tenantId ?? '', params),
    queryFn: () => listTenantPosts(tenantId as number | string, params),
    enabled: Boolean(tenantId),
    staleTime: 0,
    gcTime: 0,
  });
}
