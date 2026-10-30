export interface PermissionProfile {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  users_count?: number;
  created_at: string | null;
}

export interface PermissionCatalog {
  catalog: string[];
  presets: Record<string, string[]>;
}

export interface CreatePermissionProfilePayload {
  name: string;
  description?: string | null;
  permissions: string[];
}

export type UpdatePermissionProfilePayload = Partial<CreatePermissionProfilePayload>;
