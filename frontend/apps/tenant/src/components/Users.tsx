import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import UserFilters from '@/components/user/UserFilters';
import UserTable from '@/components/user/UserTable';
import { hasPermission } from '@/lib/permissions';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useProfiles } from '@/lib/hooks/profile.hook';
import { useDeleteUser, useInviteUser, useUsers } from '@/lib/hooks/user.hook';
import type { TenantUser } from '@/lib/types/auth.type';
import type { UserListParams } from '@/lib/types/tenant.type';

export default function Users() {
  const [searchParams] = useSearchParams();
  const { data: currentUser } = useTenantMe();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const profileId = Number(searchParams.get('permission_profile_id') ?? 0);

  const params: UserListParams = {
    search: searchParams.get('search') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    permission_profile_id: profileId > 0 ? profileId : undefined,
    page,
    per_page: 15,
  };

  const usersQuery = useUsers(params);
  const canViewProfiles = hasPermission(currentUser, 'profiles.view');
  const profilesQuery = useProfiles({ per_page: 100 }, { enabled: canViewProfiles });
  const invite = useInviteUser();
  const remove = useDeleteUser();

  const profileOptions =
    profilesQuery.data?.data.map((profile) => ({
      value: String(profile.id),
      label: profile.name,
    })) ?? [];

  const handleInvite = (user: TenantUser) => {
    invite.mutate(user.id, {
      onSuccess: (result) => {
        notify.success('Invitation sent.', {
          description: result.invitation.token
            ? 'Local token copied to the console response.'
            : 'The invitation email was sent.',
        });
      },
      onError: (error) => notify.apiError(error, 'Unable to send invitation.'),
    });
  };

  const handleDelete = (user: TenantUser) => {
    remove.mutate(user.id, {
      onSuccess: () => notify.success('User deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to delete user.'),
    });
  };

  const pendingUserId = invite.isPending
    ? invite.variables
    : remove.isPending
      ? remove.variables
      : null;

  const createAction = hasPermission(currentUser, 'users.create') ? (
    <Button asChild>
      <Link to="/users/new">
        <Plus className="size-4" />
        Invite user
      </Link>
    </Button>
  ) : undefined;

  const users = usersQuery.data;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage tenant admins and authors."
        actions={createAction}
      />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <UserFilters profileOptions={profileOptions} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={users?.meta.total}
            currentPage={users?.meta.current_page}
            lastPage={users?.meta.last_page}
            entity="users"
            actions={createAction}
          />
        </div>

        <div className="p-4">
          {usersQuery.isError ? (
            <ErrorPanel error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
          ) : (
            <UserTable
              users={users?.data ?? []}
              isLoading={usersQuery.isLoading}
              emptyAction={createAction}
              onInvite={handleInvite}
              onDelete={handleDelete}
              pendingUserId={
                typeof pendingUserId === 'number'
                  ? pendingUserId
                  : pendingUserId
                    ? Number(pendingUserId)
                    : null
              }
            />
          )}
        </div>

        {users && users.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={users.meta.last_page}
              from={users.meta.from}
              to={users.meta.to}
              total={users.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
