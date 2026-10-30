import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import type { Tenant } from '@/lib/types/tenant.type';

export default function TenantStatusBadges({ tenant }: { tenant: Tenant }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={tenant.deleted_at ? 'secondary' : 'default'}>
        {tenant.deleted_at ? 'Deleted' : 'Active'}
      </Badge>
      {tenant.allow_support ? (
        <Badge variant="outline">Support</Badge>
      ) : (
        <Badge variant="ghost">No support</Badge>
      )}
      {tenant.is_due ? <Badge variant="destructive">Due</Badge> : null}
    </div>
  );
}
