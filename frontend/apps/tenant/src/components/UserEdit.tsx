import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import UserForm from '@/components/user/UserForm';
import { useTenantMe } from '@/lib/hooks/auth.hook';
import { useUpdateUser, useUser } from '@/lib/hooks/user.hook';
import type { CreateUserPayload, UpdateUserPayload } from '@/lib/types/tenant.type';

function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Invalid value.',
    ]),
  );
}

export default function UserEdit() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useTenantMe();
  const userQuery = useUser(userId);
  const updateUser = useUpdateUser(userId ?? '');

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

  const submit = (payload: CreateUserPayload | UpdateUserPayload) => {
    updateUser.mutate(payload as UpdateUserPayload, {
      onSuccess: () => {
        notify.success('User updated.');
        navigate(`/users/${user.id}`);
      },
      onError: (error) => notify.apiError(error, 'Unable to update user.'),
    });
  };

  return (
    <div>
      <PageHeader title="Edit user" description={user.email} />
      <UserForm
        mode="edit"
        currentUserId={currentUser?.id}
        initialValues={{
          name: user.name,
          email: user.email,
          role: user.role === 'admin' ? 'admin' : 'author',
          permission_profile_id: user.profile?.id ?? null,
          extra_permissions: user.extra_permissions,
          is_tenant_owner: user.is_tenant_owner,
        }}
        onSubmit={submit}
        isPending={updateUser.isPending}
        errors={fieldErrors(updateUser.error)}
      />
    </div>
  );
}
