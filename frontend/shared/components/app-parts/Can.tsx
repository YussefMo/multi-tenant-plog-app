import type { ReactNode } from 'react';

interface CanProps {
  allowed?: boolean;
  permissions?: string[];
  requireAll?: boolean;
  hasPermission?: (permission: string) => boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

function resolveAccess({
  allowed = true,
  permissions = [],
  requireAll = false,
  hasPermission,
}: Omit<CanProps, 'fallback' | 'children'>): boolean {
  if (!hasPermission || permissions.length === 0) {
    return allowed;
  }

  return requireAll
    ? permissions.every((permission) => hasPermission(permission))
    : permissions.some((permission) => hasPermission(permission));
}

export function Can({ fallback = null, children, ...props }: CanProps) {
  return resolveAccess(props) ? <>{children}</> : <>{fallback}</>;
}

export function Cannot({ children, ...props }: Omit<CanProps, 'fallback'>) {
  return resolveAccess(props) ? null : <>{children}</>;
}
