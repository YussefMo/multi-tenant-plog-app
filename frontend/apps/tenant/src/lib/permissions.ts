import type { TenantUser } from '@/lib/types/auth.type';

export function hasPermission(user: TenantUser | null | undefined, permission: string): boolean {
  if (!user) {
    return false;
  }

  return user.permissions.includes('*') || user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: TenantUser | null | undefined,
  permissions: string[],
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}
