import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import { formatDateTime } from '@/lib/format';
import type { TenantInvitation } from '@/lib/types/tenant.type';

export default function TenantInvitationCard({
  invitation,
}: {
  invitation: TenantInvitation | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitation</CardTitle>
      </CardHeader>
      <CardContent>
        {invitation ? (
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate font-medium">{invitation.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Expires</dt>
              <dd>{formatDateTime(invitation.expires_at)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Accepted</dt>
              <dd>{invitation.accepted_at ? formatDateTime(invitation.accepted_at) : 'Pending'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">No invitation has been issued.</p>
        )}
      </CardContent>
    </Card>
  );
}
