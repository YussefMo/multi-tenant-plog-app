import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { PaginatedResponse } from '@/lib/types/api.type';
import type { TenantUser } from '@/lib/types/auth.type';
import type {
  CreateUserPayload,
  InvitationResult,
  UpdateUserPayload,
  UserListParams,
} from '@/lib/types/tenant.type';

export interface CreateUserResult {
  data: TenantUser;
  invitation?: {
    expires_at: string | null;
    token?: string;
  };
}

export async function listUsers(
  params: UserListParams = {},
): Promise<PaginatedResponse<TenantUser>> {
  const { data } = await tenantApi.get<PaginatedResponse<TenantUser>>('/users', { params });

  return data;
}

export async function getUser(userId: number | string): Promise<TenantUser> {
  const { data } = await tenantApi.get<{ data: TenantUser }>(`/users/${userId}`);

  return data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  const { data } = await tenantApi.post<CreateUserResult>('/users', payload);

  return data;
}

export async function updateUser(
  userId: number | string,
  payload: UpdateUserPayload,
): Promise<TenantUser> {
  const { data } = await tenantApi.patch<{ data: TenantUser }>(`/users/${userId}`, payload);

  return data.data;
}

export async function deleteUser(userId: number | string): Promise<void> {
  await tenantApi.delete(`/users/${userId}`);
}

export async function inviteUser(userId: number | string): Promise<InvitationResult> {
  const { data } = await tenantApi.post<InvitationResult>(`/users/${userId}/invite`);

  return data;
}
