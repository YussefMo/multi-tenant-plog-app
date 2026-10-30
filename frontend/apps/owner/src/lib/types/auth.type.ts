export interface Owner {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string | null;
}

export interface OwnerSession extends Owner {
  csrf_token?: string;
  redirect_url?: string;
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
