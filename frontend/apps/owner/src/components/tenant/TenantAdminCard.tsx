import { UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDate } from '@/lib/format';
import type { TenantAdmin } from '@/lib/types/tenant.type';

export default function TenantAdminCard({ admin }: { admin: TenantAdmin | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin</CardTitle>
      </CardHeader>
      <CardContent>
        {admin ? (
          <div className="flex items-start gap-3">
            <div className="bg-muted flex size-10 items-center justify-center rounded-full">
              <UserRound className="text-muted-foreground size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{admin.name}</p>
              <p className="text-muted-foreground truncate text-sm">{admin.email}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {admin.role ?? 'admin'} · joined {formatDate(admin.created_at)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No admin user found for this tenant.</p>
        )}
      </CardContent>
    </Card>
  );
}
