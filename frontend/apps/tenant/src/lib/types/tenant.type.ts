import type { TenantInvitationStatus, TenantSummary } from '@/lib/types/auth.type';

export interface TenantOverview {
  tenant: Pick<TenantSummary, 'id' | 'name' | 'category' | 'allow_support' | 'is_due'>;
  counts: {
    users: number | null;
    profiles: number | null;
    posts: {
      total: number;
      draft: number;
      published: number;
      archived: number;
    };
  };
  subscription: {
    id: number;
    status: string;
    plan: { id: number; name: string } | null;
    current_period_end: string | null;
    trial_ends_at: string | null;
    cancel_at_period_end: boolean;
  } | null;
}

export interface UpdateTenantPayload {
  name?: string;
  category?: string | null;
  allow_support?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'admin' | 'author';
  invite: boolean;
  password?: string;
  password_confirmation?: string;
  permission_profile_id?: number | null;
  extra_permissions?: string[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'admin' | 'author';
  password?: string;
  password_confirmation?: string;
  permission_profile_id?: number | null;
  extra_permissions?: string[];
}

export interface InvitationResult {
  message: string;
  invitation: {
    expires_at: string | null;
    token?: string;
  };
}

export interface UserListParams {
  search?: string;
  role?: string;
  permission_profile_id?: number;
  per_page?: number;
  page?: number;
}

export interface TenantInvitationStatusResponse extends TenantInvitationStatus {}
