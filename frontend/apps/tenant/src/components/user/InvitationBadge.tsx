import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import type { TenantInvitationStatus } from '@/lib/types/auth.type';

export default function InvitationBadge({
  invitation,
}: {
  invitation: TenantInvitationStatus | null;
}) {
  if (!invitation) {
    return <Badge variant="secondary">No invitation</Badge>;
  }

  if (invitation.status === 'accepted') {
    return <Badge variant="default">Accepted</Badge>;
  }

  if (invitation.status === 'expired') {
    return <Badge variant="destructive">Expired</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}
