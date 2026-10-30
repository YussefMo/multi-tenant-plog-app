import { RotateCcw, Trash2 } from 'lucide-react';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import { DangerCallout } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import type { TenantDetail } from '@/lib/types/tenant.type';

interface TenantDangerZoneProps {
  tenant: TenantDetail;
  onDelete: () => void;
  onRestore: () => void;
  onForceDelete: () => void;
  isDeleting?: boolean;
  isRestoring?: boolean;
  isPurging?: boolean;
}

export default function TenantDangerZone({
  tenant,
  onDelete,
  onRestore,
  onForceDelete,
  isDeleting = false,
  isRestoring = false,
  isPurging = false,
}: TenantDangerZoneProps) {
  const isTrashed = Boolean(tenant.deleted_at);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrashed ? (
          <>
            <DangerCallout>
              This tenant is soft-deleted. Restoring makes it active again. Purging removes it and
              all related data forever, keeping only the purge audit row.
            </DangerCallout>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={isRestoring} onClick={onRestore}>
                <RotateCcw className="size-4" />
                {isRestoring ? 'Restoring…' : 'Restore tenant'}
              </Button>
              <DeleteAlert
                title={`Permanently delete ${tenant.name}?`}
                description="This removes the tenant, users, posts, subscriptions, and billing mirrors forever. A purge audit row is kept."
                confirmLabel="Delete forever"
                isPending={isPurging}
                onConfirm={onForceDelete}
                trigger={
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    Delete forever
                  </Button>
                }
              />
            </div>
          </>
        ) : (
          <>
            <DangerCallout>
              Deleting a tenant soft-deletes it. It can be restored from the deleted tab or purged
              permanently.
            </DangerCallout>
            <DeleteAlert
              title={`Delete ${tenant.name}?`}
              description="The tenant is moved to deleted and can be restored later."
              isPending={isDeleting}
              onConfirm={onDelete}
              trigger={
                <Button variant="destructive">
                  <Trash2 className="size-4" />
                  Delete tenant
                </Button>
              }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
