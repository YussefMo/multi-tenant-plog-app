import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import type { MessageResponse } from '@/lib/types/api.type';
import type {
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  ViewerSession,
  ViewerUser,
} from '@/lib/types/auth.type';

interface SessionResponse {
  data: ViewerUser;
  csrf_token?: string;
  redirect_url?: string;
}

function sessionFrom(data: SessionResponse): ViewerSession {
  return {
    ...data.data,
    csrf_token: data.csrf_token,
    redirect_url: data.redirect_url,
  };
}

export async function loginViewer(payload: LoginPayload): Promise<ViewerSession> {
  const { data } = await tenantApi.post<SessionResponse>('/auth/login', payload);

  return sessionFrom(data);
}

export async function registerViewer(payload: RegisterPayload): Promise<ViewerSession> {
  const { data } = await tenantApi.post<SessionResponse>('/auth/register', payload);

  return sessionFrom(data);
}

export async function getViewerMe(): Promise<ViewerSession> {
  const { data } = await tenantApi.get<SessionResponse>('/auth/me');

  return sessionFrom(data);
}

export async function logoutViewer(): Promise<MessageResponse> {
  const { data } = await tenantApi.post<MessageResponse>('/auth/logout');

  return data;
}

export async function updateViewerProfile(payload: UpdateProfilePayload): Promise<ViewerUser> {
  const { data } = await tenantApi.patch<{ data: ViewerUser }>('/auth/profile', payload);

  return data.data;
}

export async function updateViewerPassword(
  payload: UpdatePasswordPayload,
): Promise<MessageResponse> {
  const { data } = await tenantApi.put<MessageResponse>('/auth/password', payload);

  return data;
}
