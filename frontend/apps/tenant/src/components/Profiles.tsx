import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import ProfileTable from '@/components/permission-profile/ProfileTable';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useDeleteProfile, useProfiles } from '@/lib/hooks/profile.hook';
import { hasPermission } from '@/lib/permissions';
import type { PermissionProfile } from '@/lib/types/profile.type';

export default function Profiles() {
  const [searchParams] = useSearchParams();
  const { data: user } = useTenantMe();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const profilesQuery = useProfiles({
    search: searchParams.get('search') ?? undefined,
    page,
    per_page: 15,
  });
  const remove = useDeleteProfile();

  const handleDelete = (profile: PermissionProfile) => {
    remove.mutate(profile.id, {
      onSuccess: () => notify.success('Profile deleted.'),
      onError: (error) => notify.apiError(error, 'Unable to delete profile.'),
    });
  };

  const createAction = hasPermission(user, 'profiles.create') ? (
    <Button asChild>
      <Link to="/profiles/new">
        <Plus className="size-4" />
        Create profile
      </Link>
    </Button>
  ) : undefined;

  const profiles = profilesQuery.data;

  return (
    <div>
      <PageHeader
        title="Permission profiles"
        description="Reusable permission sets for tenant users."
        actions={createAction}
      />

      <Card className="overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <TableTally
            total={profiles?.meta.total}
            currentPage={profiles?.meta.current_page}
            lastPage={profiles?.meta.last_page}
            entity="profiles"
            actions={createAction}
          />
        </div>

        <div className="px-4 pb-4">
          {profilesQuery.isError ? (
            <ErrorPanel error={profilesQuery.error} onRetry={() => void profilesQuery.refetch()} />
          ) : (
            <ProfileTable
              profiles={profiles?.data ?? []}
              isLoading={profilesQuery.isLoading}
              onDelete={handleDelete}
              pendingProfileId={
                remove.isPending && typeof remove.variables === 'number' ? remove.variables : null
              }
            />
          )}
        </div>

        {profiles && profiles.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={profiles.meta.last_page}
              from={profiles.meta.from}
              to={profiles.meta.to}
              total={profiles.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
