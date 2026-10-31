export interface ViewerUser {
  id: number;
  tenant_id: number | null;
  name: string;
  email: string;
  role: string | null;
  is_tenant_owner: boolean;
  permissions: string[];
  extra_permissions: string[];
  created_at: string | null;
}

export interface ViewerSession extends ViewerUser {
  csrf_token?: string;
  redirect_url?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
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
