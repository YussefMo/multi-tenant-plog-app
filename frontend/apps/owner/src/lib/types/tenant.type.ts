export type TenantState = 'active' | 'trashed' | 'all';

export interface Tenant {
  id: number;
  name: string;
  category: string | null;
  allow_support: boolean;
  is_due: boolean;
  deleted_at: string | null;
  created_at: string | null;
}

export interface TenantAdmin {
  id: number;
  name: string;
  email: string;
  role: string | null;
  created_at: string | null;
}

export interface TenantInvitation {
  email: string;
  expires_at: string | null;
  accepted_at: string | null;
}

export interface TenantSubscription {
  id: number;
  status: string;
  plan: { id: number; name: string } | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface TenantDetail extends Tenant {
  admin: TenantAdmin | null;
  invitation: TenantInvitation | null;
  subscription: TenantSubscription | null;
  counts: {
    users: number;
    posts: number;
  };
}

export interface TenantListParams {
  search?: string;
  category?: string;
  allow_support?: boolean;
  is_due?: boolean;
  state?: TenantState;
  per_page?: number;
  page?: number;
}

export interface CreateTenantPayload {
  name: string;
  category?: string | null;
  admin_name: string;
  admin_email: string;
}

export interface UpdateTenantPayload {
  name?: string;
  category?: string | null;
}

export interface CreateTenantResult {
  data: Tenant;
  admin: TenantAdmin;
  invitation: {
    expires_at: string | null;
    token?: string;
  };
}

export interface SupportAccessResult {
  ticket: string;
  expires_at: string | null;
  redirect_url: string;
}

export interface TenantPurge {
  id: number;
  tenant_id: number;
  owner_id: number;
  tenant_name: string;
  admin_email: string | null;
  purged_by_owner_id: number | null;
  purged_at: string | null;
  snapshot: Record<string, unknown> | null;
}
