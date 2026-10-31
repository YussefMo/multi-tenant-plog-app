import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type { DirectoryTenant, TenantListParams, ViewerOverview } from '@/lib/types/directory.type';
import type { Post, PostListParams } from '@/lib/types/post.type';

export async function getViewerOverview(): Promise<ViewerOverview> {
  const { data } = await tenantApi.get<{ data: ViewerOverview }>('/viewer/overview');

  return data.data;
}

export async function listDirectoryTenants(
  params: TenantListParams = {},
): Promise<PaginatedResponse<DirectoryTenant>> {
  const { data } = await tenantApi.get<PaginatedResponse<DirectoryTenant>>('/tenants', { params });

  return data;
}

export async function getDirectoryTenant(tenantId: number | string): Promise<DirectoryTenant> {
  const { data } = await tenantApi.get<{ data: DirectoryTenant }>(`/tenants/${tenantId}`);

  return data.data;
}

export async function listTenantPosts(
  tenantId: number | string,
  params: PostListParams = {},
): Promise<PaginatedResponse<Post>> {
  const { data } = await tenantApi.get<PaginatedResponse<Post>>(`/tenants/${tenantId}/posts`, {
    params,
  });

  return data;
}
