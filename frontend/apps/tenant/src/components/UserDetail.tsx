import { Mail, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import { RoleBadge, Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import InvitationBadge from '@/components/user/InvitationBadge';
import { formatDate } from '@/lib/format';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useDeleteUser, useInviteUser, useUser } from '@/lib/hooks/user.hook';

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useTenantMe();
  const userQuery = useUser(userId);
  const invite = useInviteUser();
  const remove = useDeleteUser();

  if (userQuery.isLoading) {
    return <Spinner />;
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <ErrorPanel
        error={userQuery.error ?? new Error('User not found.')}
        onRetry={() => void userQuery.refetch()}
      />
    );
  }

  const user = userQuery.data;
  const isSelf = user.id === currentUser?.id;
  const canUpdate = hasPermission(currentUser, 'users.update');
  const canDelete = hasPermission(currentUser, 'users.delete') && !isSelf;
  const canResend = canUpdate && user.invitation !== null && user.invitation.status !== 'accepted';

  const handleInvite = () => {
    invite.mutate(user.id, {
      onSuccess: () => notify.success('Invitation sent.'),
      onError: (error) => notify.apiError(error, 'Unable to send invitation.'),
    });
  };

  const handleDelete = () => {
    remove.mutate(user.id, {
      onSuccess: () => {
        notify.success('User deleted.');
        navigate('/users');
      },
      onError: (error) => notify.apiError(error, 'Unable to delete user.'),
    });
  };

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <>
            {canUpdate ? (
              <Button asChild variant="outline">
                <Link to={`/users/${user.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {canResend ? (
              <Button variant="outline" disabled={invite.isPending} onClick={handleInvite}>
                <Mail className="size-4" />
                Resend invitation
              </Button>
            ) : null}
            {canDelete ? (
              <DeleteAlert
                title={`Delete ${user.name}?`}
                description="This removes the tenant user permanently."
                isPending={remove.isPending}
                onConfirm={handleDelete}
                trigger={
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
              />
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <RoleBadge value={user.role} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Profile</span>
              <span>{user.profile?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Invitation</span>
              <InvitationBadge invitation={user.invitation} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(user.created_at)}</span>
            </div>
            {isSelf ? <p className="text-muted-foreground text-xs">This is your account.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materialized permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {user.permissions.length === 0 ? (
                <span className="text-muted-foreground text-sm">No permissions.</span>
              ) : (
                user.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="bg-muted rounded-full px-2 py-1 font-mono text-xs"
                  >
                    {permission}
                  </span>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
