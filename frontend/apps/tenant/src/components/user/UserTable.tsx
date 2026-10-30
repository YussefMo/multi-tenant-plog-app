import type { ReactNode } from 'react';
import { Eye, Mail, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import {
  PillButton,
  RoleBadge,
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import InvitationBadge from '@/components/user/InvitationBadge';
import { formatDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import type { TenantUser } from '@/lib/types/auth.type';

interface UserTableProps {
  users: TenantUser[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
  onInvite?: (user: TenantUser) => void;
  onDelete?: (user: TenantUser) => void;
  pendingUserId?: number | null;
}

export default function UserTable({
  users,
  isLoading = false,
  emptyAction,
  onInvite,
  onDelete,
  pendingUserId = null,
}: UserTableProps) {
  const navigate = useNavigate();
  const { data: currentUser } = useTenantMe();
  const canUpdate = hasPermission(currentUser, 'users.update');
  const canDelete = hasPermission(currentUser, 'users.delete');

  return (
    <Table>
      <TableHeaderRe
        headers={['User', 'Role', 'Profile', 'Invitation', 'Created', 'Actions']}
        lastColumnAlign="end"
      />
      {isLoading ? (
        <TableBodySkeleton colNum={6} rowCount={8} />
      ) : users.length === 0 ? (
        <TableBodyEmpty title="No users found" description="Invite an admin or author.">
          {emptyAction}
        </TableBodyEmpty>
      ) : (
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            const canResend =
              canUpdate && user.invitation !== null && user.invitation.status !== 'accepted';

            return (
              <TableRow key={user.id}>
                <TableCell className="px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground text-xs">{user.email}</div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <RoleBadge value={user.role} />
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                  {user.profile?.name ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <InvitationBadge invitation={user.invitation} />
                </TableCell>
                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <PillButton
                      label="View user"
                      icon={Eye}
                      onClick={() => navigate(`/users/${user.id}`)}
                    />
                    {canUpdate ? (
                      <PillButton
                        label="Edit user"
                        icon={Pencil}
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                      />
                    ) : null}
                    {canResend ? (
                      <PillButton
                        label="Resend invitation"
                        icon={Mail}
                        disabled={pendingUserId === user.id}
                        onClick={() => onInvite?.(user)}
                      />
                    ) : null}
                    {canDelete && !isSelf ? (
                      <DeleteAlert
                        title={`Delete ${user.name}?`}
                        description="This removes the tenant user permanently."
                        isPending={pendingUserId === user.id}
                        onConfirm={() => onDelete?.(user)}
                        trigger={<PillButton label="Delete user" icon={Trash2} />}
                      />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      )}
    </Table>
  );
}
