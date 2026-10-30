import { LifeBuoy } from 'lucide-react';
import { InfoCallout } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import type { TenantDetail } from '@/lib/types/tenant.type';

interface TenantSupportCardProps {
  tenant: TenantDetail;
  onOpenSupport: () => void;
  isPending?: boolean;
}

export default function TenantSupportCard({
  tenant,
  onOpenSupport,
  isPending = false,
}: TenantSupportCardProps) {
  const disabled = !tenant.allow_support || Boolean(tenant.deleted_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tenant.allow_support ? (
          <p className="text-muted-foreground text-sm">
            Support access is enabled. Opening a session creates a short-lived ticket and redirects
            to the tenant frontend.
          </p>
        ) : (
          <InfoCallout>
            Support access is disabled for this tenant. The tenant admin must enable it before an
            owner can open a support session.
          </InfoCallout>
        )}

        {tenant.deleted_at ? (
          <InfoCallout>Deleted tenants cannot be accessed until they are restored.</InfoCallout>
        ) : null}

        <Button type="button" disabled={disabled || isPending} onClick={onOpenSupport}>
          <LifeBuoy className="size-4" />
          {isPending ? 'Opening…' : 'Open support session'}
        </Button>
      </CardContent>
    </Card>
  );
}
