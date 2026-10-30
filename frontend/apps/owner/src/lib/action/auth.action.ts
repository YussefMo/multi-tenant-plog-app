import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
import type {
  LoginPayload,
  Owner,
  OwnerSession,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth.type';
import type { MessageResponse } from '@/lib/types/api.type';

interface OwnerSessionResponse {
  data: Owner;
  csrf_token?: string;
  redirect_url?: string;
}

export async function loginOwner(payload: LoginPayload): Promise<OwnerSession> {
  const { data } = await ownerApi.post<OwnerSessionResponse>('/owner/auth/login', payload);

  return {
    ...data.data,
    csrf_token: data.csrf_token,
    redirect_url: data.redirect_url,
  };
}

export async function getOwner(): Promise<Owner> {
  const { data } = await ownerApi.get<{ data: Owner }>('/owner/auth/me');

  return data.data;
}

export async function logoutOwner(): Promise<MessageResponse> {
  const { data } = await ownerApi.post<MessageResponse>('/owner/auth/logout');

  return data;
}

export async function updateOwnerProfile(payload: UpdateProfilePayload): Promise<Owner> {
  const { data } = await ownerApi.patch<{ data: Owner }>('/owner/auth/profile', payload);

  return data.data;
}

export async function updateOwnerPassword(
  payload: UpdatePasswordPayload,
): Promise<MessageResponse> {
  const { data } = await ownerApi.put<MessageResponse>('/owner/auth/password', payload);

  return data;
}
