import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDate } from '@/lib/format';
import type { TenantDetail } from '@/lib/types/tenant.type';
import TenantStatusBadges from '@/components/tenant/TenantStatusBadges';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 last:border-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function TenantSummaryCard({ tenant }: { tenant: TenantDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <TenantStatusBadges tenant={tenant} />
        </div>
        <dl>
          <Row label="Tenant ID" value={`#${tenant.id}`} />
          <Row label="Category" value={tenant.category ?? '—'} />
          <Row label="Created" value={formatDate(tenant.created_at)} />
          <Row label="Deleted" value={formatDate(tenant.deleted_at)} />
          <Row label="Users" value={String(tenant.counts.users)} />
          <Row label="Posts" value={String(tenant.counts.posts)} />
        </dl>
      </CardContent>
    </Card>
  );
}
