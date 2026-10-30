import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type {
  CreatePermissionProfilePayload,
  PermissionCatalog,
  PermissionProfile,
  UpdatePermissionProfilePayload,
} from '@/lib/types/profile.type';

export async function listProfiles(
  params: { search?: string; per_page?: number; page?: number } = {},
): Promise<PaginatedResponse<PermissionProfile>> {
  const { data } = await tenantApi.get<PaginatedResponse<PermissionProfile>>('/profiles', {
    params,
  });

  return data;
}

export async function getProfile(profileId: number | string): Promise<PermissionProfile> {
  const { data } = await tenantApi.get<{ data: PermissionProfile }>(`/profiles/${profileId}`);

  return data.data;
}

export async function createProfile(
  payload: CreatePermissionProfilePayload,
): Promise<PermissionProfile> {
  const { data } = await tenantApi.post<{ data: PermissionProfile }>('/profiles', payload);

  return data.data;
}

export async function updateProfile(
  profileId: number | string,
  payload: UpdatePermissionProfilePayload,
): Promise<PermissionProfile> {
  const { data } = await tenantApi.patch<{ data: PermissionProfile }>(
    `/profiles/${profileId}`,
    payload,
  );

  return data.data;
}

export async function deleteProfile(profileId: number | string): Promise<void> {
  await tenantApi.delete(`/profiles/${profileId}`);
}

export async function getPermissionCatalog(): Promise<PermissionCatalog> {
  const { data } = await tenantApi.get<{ data: PermissionCatalog }>('/permissions');

  return data.data;
}
