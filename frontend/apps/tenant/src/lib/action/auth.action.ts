import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { MessageResponse } from '@/lib/types/api.type';
import type {
  AcceptInvitationPayload,
  LoginPayload,
  TenantSession,
  TenantUser,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth.type';

interface SessionResponse {
  data: TenantUser;
  csrf_token?: string;
  redirect_url?: string;
  support?: boolean;
  support_owner_id?: number | null;
  support_tenant_id?: number | null;
}

function sessionFrom(data: SessionResponse): TenantSession {
  return {
    ...data.data,
    csrf_token: data.csrf_token,
    redirect_url: data.redirect_url,
    support: data.support,
    support_owner_id: data.support_owner_id,
    support_tenant_id: data.support_tenant_id,
  };
}

export async function loginTenant(payload: LoginPayload): Promise<TenantSession> {
  const { data } = await tenantApi.post<SessionResponse>('/auth/login', payload);

  return sessionFrom(data);
}

export async function getTenantMe(): Promise<TenantSession> {
  const { data } = await tenantApi.get<SessionResponse>('/auth/me');

  return sessionFrom(data);
}

export async function logoutTenant(): Promise<MessageResponse> {
  const { data } = await tenantApi.post<MessageResponse>('/auth/logout');

  return data;
}

export async function updateTenantProfile(payload: UpdateProfilePayload): Promise<TenantUser> {
  const { data } = await tenantApi.patch<{ data: TenantUser }>('/auth/profile', payload);

  return data.data;
}

export async function updateTenantPassword(
  payload: UpdatePasswordPayload,
): Promise<MessageResponse> {
  const { data } = await tenantApi.put<MessageResponse>('/auth/password', payload);

  return data;
}

export async function acceptInvitation(payload: AcceptInvitationPayload): Promise<MessageResponse> {
  const { data } = await tenantApi.post<MessageResponse>('/auth/accept-invitation', payload);

  return data;
}

export async function supportLogin(ticket: string): Promise<TenantSession> {
  const { data } = await tenantApi.post<SessionResponse>('/auth/support-login', { ticket });

  return sessionFrom(data);
}

export async function supportEnd(): Promise<{ message: string; redirect_url: string }> {
  const { data } = await tenantApi.post<{ message: string; redirect_url: string }>(
    '/auth/support/end',
  );

  return data;
}
