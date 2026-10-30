import type { PermissionProfile } from '@/lib/types/profile.type';

export interface TenantSummary {
  id: number;
  name: string;
  category: string | null;
  allow_support: boolean;
  is_due: boolean;
  deleted_at: string | null;
  created_at: string | null;
}

export interface TenantInvitationStatus {
  expires_at: string | null;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'expired';
}

export interface TenantUser {
  id: number;
  tenant_id: number | null;
  name: string;
  email: string;
  role: string | null;
  permissions: string[];
  extra_permissions: string[];
  profile: PermissionProfile | null;
  tenant: TenantSummary | null;
  invitation: TenantInvitationStatus | null;
  created_at: string | null;
}

export interface TenantSession extends TenantUser {
  csrf_token?: string;
  redirect_url?: string;
  support?: boolean;
  support_owner_id?: number | null;
  support_tenant_id?: number | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface AcceptInvitationPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
